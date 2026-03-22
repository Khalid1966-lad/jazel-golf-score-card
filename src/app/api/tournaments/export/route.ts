import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

// GET - Export tournament to Excel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    // Fetch tournament with all details
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true,
            country: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handicap: true,
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Sort participants by handicap
    const sortedParticipants = [...tournament.participants].sort((a, b) => 
      (a.user.handicap || 0) - (b.user.handicap || 0)
    );

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Tournament info sheet with participants
    const tournamentInfo = [
      ['Tournament Name', tournament.name],
      ['Date', new Date(tournament.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })],
      ['Start Time', tournament.startTime],
      ['Course', tournament.course.name],
      ['Location', `${tournament.course.city}, ${tournament.course.region}`],
      ['Format', tournament.format],
      ['Max Players', tournament.maxPlayers],
      ['Status', tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1).replace('_', ' ')],
      ['Total Participants', tournament.participants.length],
      ['', ''],
      ['PARTICIPANTS LIST', ''],
      ['#', 'Player Name', 'Handicap', 'Brut Score', 'Net Score'],
    ];

    // Add participants to the info sheet
    sortedParticipants.forEach((p, index) => {
      tournamentInfo.push([
        index + 1,
        p.user.name || 'Unknown',
        p.user.handicap || 0,
        p.grossScore || '',
        p.netScore || ''
      ]);
    });

    const wsInfo = XLSX.utils.aoa_to_sheet(tournamentInfo);
    
    // Set column widths for info sheet
    wsInfo['!cols'] = [
      { wch: 5 },   // #
      { wch: 30 },  // Player Name / Field Name
      { wch: 15 },  // Handicap / Field Value
      { wch: 12 },  // Brut Score
      { wch: 12 }   // Net Score
    ];
    
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Tournament Info');

    // Participants sheet
    const participantsHeader = ['#', 'Player Name', 'Handicap', 'Brut Score', 'Net Score'];
    const participantsData = sortedParticipants.map((p, index) => [
      index + 1,
      p.user.name || 'Unknown',
      p.user.handicap || 0,
      p.grossScore || '',
      p.netScore || ''
    ]);

    const wsParticipants = XLSX.utils.aoa_to_sheet([
      participantsHeader,
      ...participantsData
    ]);

    // Set column widths for participants sheet
    wsParticipants['!cols'] = [
      { wch: 5 },   // #
      { wch: 30 },  // Player Name
      { wch: 12 },  // Handicap
      { wch: 12 },  // Brut Score
      { wch: 12 }   // Net Score
    ];

    XLSX.utils.book_append_sheet(wb, wsParticipants, 'Participants');

    // Leaderboard sheet (sorted by gross score, then net score)
    const leaderboard = sortedParticipants
      .filter(p => p.grossScore !== null)
      .sort((a, b) => {
        if (a.grossScore !== null && b.grossScore !== null) {
          return a.grossScore - b.grossScore;
        }
        return 0;
      });

    if (leaderboard.length > 0) {
      const leaderboardHeader = ['Position', 'Player Name', 'Handicap', 'Brut', 'Net'];
      const leaderboardData = leaderboard.map((p, index) => [
        index + 1,
        p.user.name || 'Unknown',
        p.user.handicap || 0,
        p.grossScore || '',
        p.netScore || ''
      ]);

      const wsLeaderboard = XLSX.utils.aoa_to_sheet([
        leaderboardHeader,
        ...leaderboardData
      ]);

      wsLeaderboard['!cols'] = [
        { wch: 10 },  // Position
        { wch: 30 },  // Player Name
        { wch: 12 },  // Handicap
        { wch: 10 },  // Brut
        { wch: 10 }   // Net
      ];

      XLSX.utils.book_append_sheet(wb, wsLeaderboard, 'Leaderboard (by Brut)');
    }

    // Net Score Leaderboard
    const netLeaderboard = sortedParticipants
      .filter(p => p.netScore !== null)
      .sort((a, b) => {
        if (a.netScore !== null && b.netScore !== null) {
          return a.netScore - b.netScore;
        }
        return 0;
      });

    if (netLeaderboard.length > 0) {
      const netLeaderboardHeader = ['Position', 'Player Name', 'Handicap', 'Net', 'Brut'];
      const netLeaderboardData = netLeaderboard.map((p, index) => [
        index + 1,
        p.user.name || 'Unknown',
        p.user.handicap || 0,
        p.netScore || '',
        p.grossScore || ''
      ]);

      const wsNetLeaderboard = XLSX.utils.aoa_to_sheet([
        netLeaderboardHeader,
        ...netLeaderboardData
      ]);

      wsNetLeaderboard['!cols'] = [
        { wch: 10 },  // Position
        { wch: 30 },  // Player Name
        { wch: 12 },  // Handicap
        { wch: 10 },  // Net
        { wch: 10 }   // Brut
      ];

      XLSX.utils.book_append_sheet(wb, wsNetLeaderboard, 'Leaderboard (by Net)');
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Create safe filename
    const safeName = tournament.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = new Date(tournament.date).toISOString().split('T')[0];
    const filename = `${safeName}_${dateStr}.xlsx`;

    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tournament:', error);
    return NextResponse.json({ error: 'Failed to export tournament' }, { status: 500 });
  }
}
