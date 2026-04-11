import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tournaments/scorecard?tournamentId=xxx
// Returns all data needed for the tournament scorecard summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    // 1. Fetch tournament with course data
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        course: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 2. Fetch all course holes ordered by holeNumber
    const holes = await db.courseHole.findMany({
      where: { courseId: tournament.courseId },
      orderBy: { holeNumber: 'asc' },
      select: {
        holeNumber: true,
        par: true,
        handicap: true,
      },
    });

    // 3. Fetch all TournamentParticipants with user info
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handicap: true,
          },
        },
      },
      orderBy: { groupLetter: 'asc' },
    });

    // 4. Fetch all TournamentScoringRounds with round data and scores
    const scoringRounds = await db.tournamentScoringRound.findMany({
      where: { tournamentId },
      include: {
        scorer: {
          select: { id: true, name: true, handicap: true },
        },
        round: {
          include: {
            scores: {
              orderBy: [{ holeNumber: 'asc' }, { playerIndex: 'asc' }],
            },
          },
        },
      },
    });

    // 5. Also check for standalone Rounds with tournamentId but no scoring round (edge case)
    const scoredUserIds = new Set(scoringRounds.map(sr => sr.scorerId));
    const participantUserIds = participants.map(p => p.userId);
    const scoringRoundGroupLetters = new Set(scoringRounds.map(sr => sr.groupLetter));

    const standaloneRounds = await db.round.findMany({
      where: {
        tournamentId,
        NOT: {
          id: { in: scoringRounds.map(sr => sr.roundId).filter(Boolean) },
        },
      },
      include: {
        scores: {
          orderBy: [{ holeNumber: 'asc' }, { playerIndex: 'asc' }],
        },
        user: {
          select: { id: true, name: true, handicap: true },
        },
      },
    });

    // Build a map of participants by userId for quick lookup
    const participantMap = new Map<string, typeof participants[0]>();
    participants.forEach(p => participantMap.set(p.userId, p));

    // Build hole par map for per-hole calculation
    const holeParMap = new Map<number, number>();
    holes.forEach(h => holeParMap.set(h.holeNumber, h.par));

    // Determine the number of holes (9 or 18 based on course)
    const totalHoles = holes.length || 18;

    // Build players array with per-hole scores
    // grossScore = brut vs par = sum of (strokes - par) for scored holes (same as leaderboard)
    // netScore = brut vs par - handicap (same as leaderboard)
    const playerMap = new Map<string, {
      name: string;
      handicap: number;
      groupLetter: string;
      scores: (number | null)[];
      gross: number;
      net: number;
    }>();

    // No longer needed — we use the same formula as recalculate
    // (strokes received per hole is removed; net = brut - handicap)

    // Process scoring rounds
    for (const sr of scoringRounds) {
      if (!sr.round) continue;

      const roundScores = sr.round.scores || [];
      const playerNamesRaw = sr.round.playerNames ? JSON.parse(sr.round.playerNames) : [];

      // Build player info for all indices (0=scorer, 1/2/3=others)
      const allPlayers: Array<{ userId: string; name: string; handicap: number; groupLetter: string }> = [];

      // PlayerIndex 0 = scorer
      const scorerParticipant = participantMap.get(sr.scorerId);
      allPlayers.push({
        userId: sr.scorerId,
        name: sr.scorer.name || 'Unknown',
        handicap: sr.scorer.handicap || 0,
        groupLetter: scorerParticipant?.groupLetter || sr.groupLetter || '',
      });

      // PlayerIndex 1,2,3 = other players from playerNames JSON
      for (let idx = 0; idx < playerNamesRaw.length; idx++) {
        const pn = playerNamesRaw[idx];
        const userId = pn.userId || pn.id || `unknown_${idx}`;
        const participant = participantMap.get(userId);
        allPlayers.push({
          userId,
          name: pn.name || 'Unknown',
          handicap: pn.handicap || 0,
          groupLetter: participant?.groupLetter || sr.groupLetter || '',
        });
      }

      // Group scores by playerIndex
      const scoresByPlayer = new Map<number, Map<number, number>>();
      roundScores.forEach(s => {
        if (s.strokes <= 0) return;
        const playerScores = scoresByPlayer.get(s.playerIndex) || new Map<number, number>();
        playerScores.set(s.holeNumber, s.strokes);
        scoresByPlayer.set(s.playerIndex, playerScores);
      });

      // Update playerMap with scores from this round
      for (let playerIdx = 0; playerIdx < allPlayers.length; playerIdx++) {
        const pInfo = allPlayers[playerIdx];
        const existing = playerMap.get(pInfo.userId);

        // Initialize scores array if not exists
        const scores = existing?.scores ? [...existing.scores] : new Array(totalHoles).fill(null) as (number | null)[];
        const playerScores = scoresByPlayer.get(playerIdx) || new Map<number, number>();

        holes.forEach((hole, idx) => {
          if (playerScores.has(hole.holeNumber)) {
            scores[idx] = playerScores.get(hole.holeNumber)!;
          }
        });

        // Calculate gross (brut vs par) and net (brut vs par - handicap) — same as leaderboard
        let brutVsPar = 0;
        let hasAnyScore = false;
        holes.forEach((hole, idx) => {
          if (scores[idx] !== null) {
            hasAnyScore = true;
            const par = hole.par || 4;
            brutVsPar += (scores[idx]! - par);
          }
        });

        if (!hasAnyScore) continue;

        const netScore = Math.round((brutVsPar - pInfo.handicap) * 10) / 10;

        playerMap.set(pInfo.userId, {
          name: pInfo.name,
          handicap: pInfo.handicap,
          groupLetter: pInfo.groupLetter,
          scores,
          gross: brutVsPar,
          net: netScore,
        });
      }
    }

    // Process standalone rounds (players who scored without tournamentScoringRound)
    for (const round of standaloneRounds) {
      const roundScores = round.scores || [];
      const participant = participantMap.get(round.userId);

      if (!participant && !round.user) continue;

      const userId = round.userId;
      const playerNamesRaw = round.playerNames ? JSON.parse(round.playerNames) : [];

      // Build player info for all indices
      const allPlayers: Array<{ userId: string; name: string; handicap: number; groupLetter: string }> = [];

      // PlayerIndex 0 = round user
      allPlayers.push({
        userId,
        name: round.user.name || 'Unknown',
        handicap: round.playerHandicap || round.user.handicap || 0,
        groupLetter: round.tournamentGroupLetter || participant?.groupLetter || '',
      });

      // PlayerIndex 1,2,3 = other players
      for (let idx = 0; idx < playerNamesRaw.length; idx++) {
        const pn = playerNamesRaw[idx];
        const otherUserId = pn.userId || pn.id || `standalone_${idx}`;
        const otherParticipant = participantMap.get(otherUserId);
        allPlayers.push({
          userId: otherUserId,
          name: pn.name || 'Unknown',
          handicap: pn.handicap || 0,
          groupLetter: otherParticipant?.groupLetter || round.tournamentGroupLetter || '',
        });
      }

      // Group scores by playerIndex
      const scoresByPlayer = new Map<number, Map<number, number>>();
      roundScores.forEach(s => {
        if (s.strokes <= 0) return;
        const playerScores = scoresByPlayer.get(s.playerIndex) || new Map<number, number>();
        playerScores.set(s.holeNumber, s.strokes);
        scoresByPlayer.set(s.playerIndex, playerScores);
      });

      for (let playerIdx = 0; playerIdx < allPlayers.length; playerIdx++) {
        const pInfo = allPlayers[playerIdx];
        // Skip if already processed from scoring rounds
        if (playerMap.has(pInfo.userId)) continue;

        const scores = new Array(totalHoles).fill(null) as (number | null)[];
        const playerScores = scoresByPlayer.get(playerIdx) || new Map<number, number>();

        holes.forEach((hole, idx) => {
          if (playerScores.has(hole.holeNumber)) {
            scores[idx] = playerScores.get(hole.holeNumber)!;
          }
        });

        let brutVsPar = 0;
        let hasAnyScore = false;
        holes.forEach((hole, idx) => {
          if (scores[idx] !== null) {
            hasAnyScore = true;
            const par = hole.par || 4;
            brutVsPar += (scores[idx]! - par);
          }
        });

        if (!hasAnyScore) continue;

        const netScore = Math.round((brutVsPar - pInfo.handicap) * 10) / 10;

        playerMap.set(pInfo.userId, {
          name: pInfo.name,
          handicap: pInfo.handicap,
          groupLetter: pInfo.groupLetter,
          scores,
          gross: brutVsPar,
          net: netScore,
        });
      }
    }

    // Also add participants who have grossScore/netScore but no detailed hole scores
    for (const p of participants) {
      if (playerMap.has(p.userId)) continue;
      if (p.grossScore === null && p.netScore === null) continue;

      playerMap.set(p.userId, {
        name: p.user.name || 'Unknown',
        handicap: p.user.handicap || 0,
        groupLetter: p.groupLetter || '',
        scores: new Array(totalHoles).fill(null) as (number | null)[],
        gross: p.grossScore || 0,
        net: p.netScore || 0,
      });
    }

    // Convert to array and sort by netScore (nulls last)
    const players = Array.from(playerMap.values()).sort((a, b) => {
      const aNet = a.scores.some(s => s !== null) ? a.net : Infinity;
      const bNet = b.scores.some(s => s !== null) ? b.net : Infinity;
      return aNet - bNet;
    });

    // Build response
    const response = {
      tournament: {
        name: tournament.name,
        date: tournament.date.toISOString(),
        format: tournament.format,
        course: {
          name: tournament.course.name,
          city: tournament.course.city,
        },
      },
      holes: holes.map(h => ({
        number: h.holeNumber,
        par: h.par,
        hcpIndex: h.handicap,
      })),
      players,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tournament scorecard:', error);
    return NextResponse.json({ error: 'Failed to fetch scorecard data' }, { status: 500 });
  }
}
