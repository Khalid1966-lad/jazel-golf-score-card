import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/tournaments/admin-scores?tournamentId=xxx&groupLetter=A
// Load the scorer's live scorecard for a group — returns per-hole strokes for all players
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const groupLetter = searchParams.get('groupLetter');

    if (!tournamentId || !groupLetter) {
      return NextResponse.json({ error: 'tournamentId and groupLetter required' }, { status: 400 });
    }

    // Find the active scoring round for this group
    const scoringRound = await db.tournamentScoringRound.findUnique({
      where: { tournamentId_groupLetter: { tournamentId, groupLetter } },
      include: {
        scorer: { select: { id: true, name: true, handicap: true } },
        round: {
          include: {
            scores: {
              orderBy: [{ holeNumber: 'asc' }, { playerIndex: 'asc' }],
            },
          },
        },
      },
    });

    if (!scoringRound || !scoringRound.round) {
      return NextResponse.json({ error: 'No active scoring round found for this group' }, { status: 404 });
    }

    // Parse player names from round
    const playerNamesRaw = scoringRound.round.playerNames
      ? JSON.parse(scoringRound.round.playerNames)
      : [];

    // Build players list: index 0 = scorer, 1..N = others from playerNames
    const players = [
      {
        playerIndex: 0,
        userId: scoringRound.scorerId,
        name: scoringRound.scorer.name || 'Unknown',
        handicap: scoringRound.round.playerHandicap || scoringRound.scorer.handicap || 0,
      },
      ...playerNamesRaw.map((pn: { userId?: string; name?: string; handicap?: number }, idx: number) => ({
        playerIndex: idx + 1,
        userId: pn.userId || `unknown_${idx}`,
        name: pn.name || 'Unknown',
        handicap: pn.handicap || 0,
      })),
    ];

    // Fetch course holes for par info
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { courseId: true },
    });

    const holes = tournament?.courseId
      ? await db.courseHole.findMany({
          where: { courseId: tournament.courseId },
          orderBy: { holeNumber: 'asc' },
          select: { holeNumber: true, par: true },
        })
      : [];

    const holeParMap = new Map<number, number>();
    holes.forEach((h) => holeParMap.set(h.holeNumber, h.par || 4));

    // Build scores grid: playerIndex -> holeNumber -> strokes
    const scoresByPlayer = new Map<number, Map<number, { strokes: number; id?: string }>>();
    for (const s of scoringRound.round.scores) {
      if (!scoresByPlayer.has(s.playerIndex)) scoresByPlayer.set(s.playerIndex, new Map());
      scoresByPlayer.get(s.playerIndex)!.set(s.holeNumber, { strokes: s.strokes, id: s.id });
    }

    // Build the scorecard data
    const scorecard = players.map((p) => {
      const playerScores = scoresByPlayer.get(p.playerIndex) || new Map();
      const holeData = holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par || 4,
        strokes: playerScores.get(h.holeNumber)?.strokes || 0,
        roundScoreId: playerScores.get(h.holeNumber)?.id || null,
      }));

      // Calculate brut vs par (only holes with strokes > 0)
      let brutVsPar = 0;
      let scoredHoles = 0;
      for (const hd of holeData) {
        if (hd.strokes > 0) {
          brutVsPar += hd.strokes - hd.par;
          scoredHoles++;
        }
      }
      const netVsPar = brutVsPar - p.handicap;

      return {
        ...p,
        holes: holeData,
        brut: scoredHoles > 0 ? brutVsPar : null,
        net: scoredHoles > 0 ? Math.round(netVsPar * 10) / 10 : null,
      };
    });

    // Fetch WD info for players in this group
    const participants = await db.tournamentParticipant.findMany({
      where: { tournamentId, groupLetter },
      select: { userId: true, withdrawn: true, wdHole: true },
    });
    const wdMap = new Map<string, { withdrawn: boolean; wdHole: number | null }>();
    for (const p of participants) {
      wdMap.set(p.userId, { withdrawn: p.withdrawn, wdHole: p.wdHole });
    }

    // Attach WD info to scorecard players
    for (const player of scorecard) {
      const wdInfo = wdMap.get(player.userId);
      if (wdInfo) {
        player.withdrawn = wdInfo.withdrawn;
        player.wdHole = wdInfo.wdHole;
      }
    }

    return NextResponse.json({
      scoringRoundId: scoringRound.id,
      roundId: scoringRound.roundId,
      status: scoringRound.status,
      currentHole: scoringRound.currentHole,
      scorerName: scoringRound.scorer.name,
      holes: holes.map((h) => ({ holeNumber: h.holeNumber, par: h.par })),
      players: scorecard,
    });
  } catch (error) {
    console.error('[Admin Scores] GET error:', error);
    return NextResponse.json({ error: 'Failed to load scorecard' }, { status: 500 });
  }
}

// PUT /api/tournaments/admin-scores
// Admin updates a player's hole score in the scorer's round
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, groupLetter, roundId, holeNumber, playerIndex, strokes, adminId } = body;

    if (!tournamentId || !groupLetter || !roundId || holeNumber === undefined || playerIndex === undefined || !adminId) {
      return NextResponse.json(
        { error: 'tournamentId, groupLetter, roundId, holeNumber, playerIndex, and adminId are required' },
        { status: 400 }
      );
    }

    // Verify admin access
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.adminId !== adminId) {
      return NextResponse.json({ error: 'Only the tournament admin can edit scores' }, { status: 403 });
    }

    // Find the scoring round
    const scoringRound = await db.tournamentScoringRound.findUnique({
      where: { tournamentId_groupLetter: { tournamentId, groupLetter } },
      include: {
        round: { include: { scores: true } },
      },
    });

    if (!scoringRound || !scoringRound.round) {
      return NextResponse.json({ error: 'No scoring round found for this group' }, { status: 404 });
    }

    // Upsert the RoundScore
    await db.roundScore.upsert({
      where: {
        roundId_holeNumber_playerIndex: {
          roundId,
          holeNumber,
          playerIndex,
        },
      },
      update: {
        strokes: strokes || 0,
      },
      create: {
        roundId,
        holeNumber,
        playerIndex,
        strokes: strokes || 0,
        putts: 0,
        fairwayHit: null,
        greenInReg: false,
        penalties: 0,
      },
    });

    // Recalculate gross/net for the updated player
    // Build player index -> userId mapping
    const playerNamesRaw = scoringRound.round.playerNames
      ? JSON.parse(scoringRound.round.playerNames)
      : [];

    let targetUserId: string;
    if (playerIndex === 0) {
      targetUserId = scoringRound.scorerId;
    } else {
      const pn = playerNamesRaw[playerIndex - 1];
      targetUserId = pn?.userId || `unknown_${playerIndex - 1}`;
    }

    // Get player handicap
    const targetHandicap =
      playerIndex === 0
        ? scoringRound.round.playerHandicap || 0
        : playerNamesRaw[playerIndex - 1]?.handicap || 0;

    // Fetch course holes for par info
    const courseInfo = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { courseId: true },
    });

    const courseHoles = courseInfo?.courseId
      ? await db.courseHole.findMany({
          where: { courseId: courseInfo.courseId },
          select: { holeNumber: true, par: true },
        })
      : [];

    const holeParMap = new Map<number, number>();
    courseHoles.forEach((h) => holeParMap.set(h.holeNumber, h.par || 4));

    // Fetch all scores for this player in this round
    const playerAllScores = scoringRound.round.scores.filter(
      (s) => s.playerIndex === playerIndex && s.strokes > 0
    );

    // Include the just-updated score (it might not be in the cached scores yet)
    if (strokes && strokes > 0) {
      const existingIdx = playerAllScores.findIndex((s) => s.holeNumber === holeNumber);
      if (existingIdx >= 0) {
        playerAllScores[existingIdx] = { ...playerAllScores[existingIdx], strokes };
      } else {
        playerAllScores.push({ holeNumber, strokes, playerIndex } as any);
      }
    } else {
      // strokes = 0 means clear — remove from calculation
      // (the record still exists with strokes=0, which is fine)
    }

    const brutVsPar = playerAllScores.reduce(
      (sum, s) => sum + (s.strokes - (holeParMap.get(s.holeNumber) || 4)),
      0
    );
    const netVsPar = Math.round((brutVsPar - targetHandicap) * 10) / 10;

    // Update the TournamentParticipant's gross/net
    try {
      const participant = await db.tournamentParticipant.findUnique({
        where: { tournamentId_userId: { tournamentId, userId: targetUserId } },
      });

      if (participant && !participant.lockedAt) {
        await db.tournamentParticipant.update({
          where: { tournamentId_userId: { tournamentId, userId: targetUserId } },
          data: {
            grossScore: playerAllScores.length > 0 ? brutVsPar : null,
            netScore: playerAllScores.length > 0 ? netVsPar : null,
            scoredAt: new Date(),
          },
        });
      }
    } catch {
      // Participant update failed — not critical
    }

    return NextResponse.json({
      success: true,
      holeNumber,
      playerIndex,
      strokes: strokes || 0,
      gross: playerAllScores.length > 0 ? brutVsPar : null,
      net: playerAllScores.length > 0 ? netVsPar : null,
    });
  } catch (error) {
    console.error('[Admin Scores] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }
}
