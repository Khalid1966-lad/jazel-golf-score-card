import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    // Debug: Check if achievement model exists
    if (!db.achievement) {
      console.error('db.achievement is undefined. Available models:', Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')));
      return NextResponse.json({ 
        error: 'Achievement model not available',
        models: Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$'))
      }, { status: 500 });
    }
    
    // Get all achievements
    const allAchievements = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    
    // Get user's earned achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    
    const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
    
    // Get stats for progress calculation
    const roundCount = await db.round.count({ where: { userId, completed: true } });
    
    const uniqueCourses = await db.round.findMany({
      where: { userId, completed: true },
      select: { courseId: true },
      distinct: ['courseId'],
    });
    
    const tournamentCount = await db.tournamentParticipant.count({
      where: { userId },
    });
    
    // Get best scores
    const bestRound18 = await db.round.findFirst({
      where: { userId, completed: true, holesPlayed: 18, totalStrokes: { not: null } },
      orderBy: { totalStrokes: 'asc' },
      select: { totalStrokes: true },
    });
    
    const bestRound9 = await db.round.findFirst({
      where: { userId, completed: true, holesPlayed: 9, totalStrokes: { not: null } },
      orderBy: { totalStrokes: 'asc' },
      select: { totalStrokes: true },
    });
    
    // Build progress data
    const achievements = allAchievements.map(a => {
      const earned = userAchievements.find(ua => ua.achievementId === a.id);
      
      let progress = 0;
      let progressText = '';
      
      if (!earned) {
        // Calculate progress for locked achievements
        switch (a.code) {
          case 'first_round':
          case 'rounds_5':
          case 'rounds_10':
          case 'rounds_25':
          case 'rounds_50':
          case 'rounds_100':
            progress = Math.min(100, (roundCount / (a.threshold || 1)) * 100);
            progressText = `${roundCount}/${a.threshold} rounds`;
            break;
          case 'courses_3':
          case 'courses_5':
          case 'courses_10':
            progress = Math.min(100, (uniqueCourses.length / (a.threshold || 1)) * 100);
            progressText = `${uniqueCourses.length}/${a.threshold} courses`;
            break;
          case 'first_tournament':
          case 'tournaments_3':
          case 'tournaments_5':
            progress = Math.min(100, (tournamentCount / (a.threshold || 1)) * 100);
            progressText = `${tournamentCount}/${a.threshold} tournaments`;
            break;
          case 'under_100_18':
          case 'under_90_18':
          case 'under_80_18':
          case 'par_18':
            progressText = bestRound18?.totalStrokes 
              ? `Best: ${bestRound18.totalStrokes}` 
              : 'No 18-hole rounds';
            break;
          case 'under_50_9':
          case 'under_45_9':
          case 'under_40_9':
            progressText = bestRound9?.totalStrokes 
              ? `Best: ${bestRound9.totalStrokes}` 
              : 'No 9-hole rounds';
            break;
          default:
            progressText = 'Keep playing!';
        }
      }
      
      return {
        ...a,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
        progress,
        progressText,
      };
    });
    
    // Calculate level based on points
    let level = 'Beginner';
    let nextLevel = 'Amateur';
    let pointsToNext = 50 - totalPoints;
    
    if (totalPoints >= 200) {
      level = 'Master';
      nextLevel = 'Legend';
      pointsToNext = 500 - totalPoints;
    } else if (totalPoints >= 100) {
      level = 'Expert';
      nextLevel = 'Master';
      pointsToNext = 200 - totalPoints;
    } else if (totalPoints >= 50) {
      level = 'Advanced';
      nextLevel = 'Expert';
      pointsToNext = 100 - totalPoints;
    } else if (totalPoints >= 20) {
      level = 'Intermediate';
      nextLevel = 'Advanced';
      pointsToNext = 50 - totalPoints;
    }
    
    return NextResponse.json({
      achievements,
      totalPoints,
      earnedCount: userAchievements.length,
      totalCount: allAchievements.length,
      level,
      nextLevel,
      pointsToNext: Math.max(0, pointsToNext),
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements', details: String(error) },
      { status: 500 }
    );
  }
}
