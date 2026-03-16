import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/rounds/export - Export round as XLSX
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roundId = searchParams.get('roundId');

    if (!roundId) {
      return NextResponse.json(
        { error: 'Round ID is required' },
        { status: 400 }
      );
    }

    // Fetch round with all related data
    const round = await db.round.findUnique({
      where: { id: roundId },
      include: {
        course: {
          include: {
            holes: { orderBy: { holeNumber: 'asc' } },
            tees: true,
          },
        },
        scores: {
          orderBy: [{ playerIndex: 'asc' }, { holeNumber: 'asc' }],
        },
        user: {
          select: {
            name: true,
            handicap: true,
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }

    // Parse player names
    let players: { name: string; handicap?: number | null }[] = [];
    if (round.playerNames) {
      try {
        const parsed = JSON.parse(round.playerNames);
        players = parsed.map((p: string | { name: string; handicap?: number | null }) => 
          typeof p === 'string' ? { name: p } : { name: p.name, handicap: p.handicap }
        );
      } catch (e) {}
    }

    // Get tee name
    const teeName = round.course.tees?.find(t => t.id === round.teeId)?.name || 'Unknown';

    // Calculate course par
    const coursePar = round.course.holes?.reduce((sum: number, h: { par: number }) => sum + h.par, 0) || 72;

    // Separate scores by player
    const mainPlayerScores = round.scores.filter(s => s.playerIndex === 0);
    const additionalPlayerScores = new Map<number, typeof round.scores>();
    round.scores.forEach(s => {
      if (s.playerIndex > 0) {
        const existing = additionalPlayerScores.get(s.playerIndex) || [];
        existing.push(s);
        additionalPlayerScores.set(s.playerIndex, existing);
      }
    });

    // Generate CSV content (simple approach that works in browser)
    // We'll create a simple CSV that Excel can open
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows: string[][] = [];

    // Header info
    rows.push(['Golf Round Scorecard']);
    rows.push(['Course', round.course.name]);
    rows.push(['Location', `${round.course.city}, Morocco`]);
    rows.push(['Date', new Date(round.date).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })]);
    rows.push(['Tee', teeName]);
    rows.push(['Course Par', coursePar.toString()]);
    rows.push([]);

    // Player info
    rows.push(['Player Information']);
    rows.push(['Player', 'Handicap', 'Total Strokes', 'Putts', 'Fairways Hit', 'GIR', 'Penalties', 'Vs Par']);
    
    // Main player
    const mainTotal = mainPlayerScores.reduce((sum, s) => sum + s.strokes, 0);
    const mainPutts = mainPlayerScores.reduce((sum, s) => sum + (s.putts || 0), 0);
    const mainFWY = mainPlayerScores.filter(s => s.fairwayHit === true).length;
    const mainGIR = mainPlayerScores.filter(s => s.greenInReg).length;
    const mainPen = mainPlayerScores.reduce((sum, s) => sum + (s.penalties || 0), 0);
    rows.push([
      escapeCSV(round.user?.name || 'Player'),
      round.user?.handicap?.toString() || '-',
      mainTotal.toString(),
      mainPutts.toString(),
      mainFWY.toString(),
      mainGIR.toString(),
      mainPen.toString(),
      (mainTotal - coursePar > 0 ? '+' : '') + (mainTotal - coursePar).toString()
    ]);

    // Additional players
    additionalPlayerScores.forEach((scores, idx) => {
      const playerInfo = players[idx] || { name: `Player ${idx + 1}` };
      const pTotal = scores.reduce((sum, s) => sum + s.strokes, 0);
      const pPutts = scores.reduce((sum, s) => sum + (s.putts || 0), 0);
      const pFWY = scores.filter(s => s.fairwayHit === true).length;
      const pGIR = scores.filter(s => s.greenInReg).length;
      const pPen = scores.reduce((sum, s) => sum + (s.penalties || 0), 0);
      rows.push([
        escapeCSV(playerInfo.name),
        playerInfo.handicap?.toString() || '-',
        pTotal.toString(),
        pPutts.toString(),
        pFWY.toString(),
        pGIR.toString(),
        pPen.toString(),
        (pTotal - coursePar > 0 ? '+' : '') + (pTotal - coursePar).toString()
      ]);
    });
    rows.push([]);

    // Scorecard header
    const headerRow = ['Hole'];
    for (let i = 1; i <= Math.min(round.course.totalHoles, 18); i++) {
      headerRow.push(i.toString());
    }
    headerRow.push('Total');
    rows.push(headerRow);

    // Par row
    const parRow = ['Par'];
    let parTotal = 0;
    for (let i = 1; i <= Math.min(round.course.totalHoles, 18); i++) {
      const hole = round.course.holes?.find((h: { holeNumber: number }) => h.holeNumber === i);
      const par = hole?.par || 4;
      parRow.push(par.toString());
      parTotal += par;
    }
    parRow.push(parTotal.toString());
    rows.push(parRow);

    // Score rows for each player
    // Main player scores
    const mainScoreRow = [escapeCSV(round.user?.name || 'Player')];
    let mainStrokes = 0;
    for (let i = 1; i <= Math.min(round.course.totalHoles, 18); i++) {
      const score = mainPlayerScores.find(s => s.holeNumber === i);
      const strokes = score?.strokes || 0;
      mainScoreRow.push(strokes.toString());
      mainStrokes += strokes;
    }
    mainScoreRow.push(mainStrokes.toString());
    rows.push(mainScoreRow);

    // Additional player scores
    additionalPlayerScores.forEach((scores, idx) => {
      const playerInfo = players[idx] || { name: `Player ${idx + 1}` };
      const scoreRow = [escapeCSV(playerInfo.name)];
      let totalStrokes = 0;
      for (let i = 1; i <= Math.min(round.course.totalHoles, 18); i++) {
        const score = scores.find(s => s.holeNumber === i);
        const strokes = score?.strokes || 0;
        scoreRow.push(strokes.toString());
        totalStrokes += strokes;
      }
      scoreRow.push(totalStrokes.toString());
      rows.push(scoreRow);
    });
    rows.push([]);

    // Detailed stats for main player
    rows.push(['Detailed Statistics (Main Player)']);
    const detailHeader = ['Hole', 'Par', 'Strokes', 'Putts', 'Fairway', 'GIR', 'Penalties', 'Score'];
    rows.push(detailHeader);

    for (let i = 1; i <= Math.min(round.course.totalHoles, 18); i++) {
      const hole = round.course.holes?.find((h: { holeNumber: number }) => h.holeNumber === i);
      const score = mainPlayerScores.find(s => s.holeNumber === i);
      const par = hole?.par || 4;
      const strokes = score?.strokes || 0;
      const diff = strokes - par;
      let scoreName = '';
      if (strokes > 0) {
        if (diff <= -2) scoreName = 'Eagle';
        else if (diff === -1) scoreName = 'Birdie';
        else if (diff === 0) scoreName = 'Par';
        else if (diff === 1) scoreName = 'Bogey';
        else if (diff === 2) scoreName = 'D. Bogey';
        else if (diff >= 3) scoreName = 'Triple+';
      }
      rows.push([
        i.toString(),
        par.toString(),
        strokes.toString() || '-',
        score?.putts?.toString() || '0',
        score?.fairwayHit === true ? 'Yes' : score?.fairwayHit === false ? 'No' : '-',
        score?.greenInReg ? 'Yes' : 'No',
        score?.penalties?.toString() || '0',
        scoreName || '-'
      ]);
    }

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Return as downloadable file with .csv extension (Excel opens CSV files)
    // Using text/csv with BOM for Excel compatibility
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const response = new NextResponse(bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${round.course.name}_${new Date(round.date).toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting round:', error);
    return NextResponse.json(
      { error: 'Failed to export round' },
      { status: 500 }
    );
  }
}
