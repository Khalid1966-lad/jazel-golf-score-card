import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Achievement definitions - seeded if not exist
const ACHIEVEMENT_DEFINITIONS = [
  // ==================== ROUNDS BADGES ====================
  { code: 'first_round', name: 'First Swing', description: 'Complete your first round', icon: '🏌️', category: 'rounds', points: 10, threshold: 1, sortOrder: 1 },
  { code: 'rounds_5', name: 'Getting Started', description: 'Complete 5 rounds', icon: '📅', category: 'rounds', points: 20, threshold: 5, sortOrder: 2 },
  { code: 'rounds_10', name: 'Regular Golfer', description: 'Complete 10 rounds', icon: '🥈', category: 'rounds', points: 30, threshold: 10, sortOrder: 3 },
  { code: 'rounds_25', name: 'Dedicated Player', description: 'Complete 25 rounds', icon: '🥇', category: 'rounds', points: 50, threshold: 25, sortOrder: 4 },
  { code: 'rounds_50', name: 'Golf Addict', description: 'Complete 50 rounds', icon: '🏆', category: 'rounds', points: 100, threshold: 50, sortOrder: 5 },
  { code: 'rounds_100', name: 'Golf Legend', description: 'Complete 100 rounds', icon: '👑', category: 'rounds', points: 200, threshold: 100, sortOrder: 6 },
  
  // ==================== SCORING BADGES (18 Holes) ====================
  { code: 'under_100_18', name: 'Century Breaker', description: 'Score under 100 on 18 holes', icon: '💯', category: 'scoring', points: 15, holesRequired: 18, threshold: 99, sortOrder: 10 },
  { code: 'under_90_18', name: 'Breaking 90', description: 'Score under 90 on 18 holes', icon: '🎯', category: 'scoring', points: 30, holesRequired: 18, threshold: 89, sortOrder: 11 },
  { code: 'under_80_18', name: 'Elite Golfer', description: 'Score under 80 on 18 holes', icon: '💎', category: 'scoring', points: 60, holesRequired: 18, threshold: 79, sortOrder: 12 },
  { code: 'par_18', name: 'Par Master', description: 'Shoot par or better on 18 holes', icon: '⭐', category: 'scoring', points: 100, holesRequired: 18, threshold: 72, sortOrder: 13 },
  
  // ==================== SCORING BADGES (9 Holes) ====================
  { code: 'under_50_9', name: 'Half Century', description: 'Score under 50 on 9 holes', icon: '🔥', category: 'scoring', points: 15, holesRequired: 9, threshold: 49, sortOrder: 20 },
  { code: 'under_45_9', name: 'Sharp Shooter', description: 'Score under 45 on 9 holes', icon: '🎯', category: 'scoring', points: 30, holesRequired: 9, threshold: 44, sortOrder: 21 },
  { code: 'under_40_9', name: 'Nine Hole Master', description: 'Score under 40 on 9 holes', icon: '💎', category: 'scoring', points: 60, holesRequired: 9, threshold: 39, sortOrder: 22 },
  
  // ==================== COURSES BADGES ====================
  { code: 'courses_3', name: 'Explorer', description: 'Play at 3 different courses', icon: '🗺️', category: 'courses', points: 20, threshold: 3, sortOrder: 30 },
  { code: 'courses_5', name: 'Traveler', description: 'Play at 5 different courses', icon: '✈️', category: 'courses', points: 40, threshold: 5, sortOrder: 31 },
  { code: 'courses_10', name: 'Moroccan Tour', description: 'Play at 10 different courses', icon: '🇲🇦', category: 'courses', points: 80, threshold: 10, sortOrder: 32 },
  { code: 'home_course', name: 'Home Course Hero', description: 'Play 5 rounds at the same course', icon: '🏠', category: 'courses', points: 25, threshold: 5, sortOrder: 33 },
  
  // ==================== TOURNAMENT BADGES ====================
  { code: 'first_tournament', name: 'Tournament Rookie', description: 'Enter your first tournament', icon: '🏟️', category: 'tournaments', points: 15, threshold: 1, sortOrder: 40 },
  { code: 'tournaments_3', name: 'Tournament Regular', description: 'Enter 3 tournaments', icon: '🎖️', category: 'tournaments', points: 30, threshold: 3, sortOrder: 41 },
  { code: 'tournaments_5', name: 'Competition Lover', description: 'Enter 5 tournaments', icon: '🏅', category: 'tournaments', points: 50, threshold: 5, sortOrder: 42 },
  { code: 'podium_finish', name: 'Podium Finish', description: 'Finish in top 3 of a tournament', icon: '🥉', category: 'tournaments', points: 60, sortOrder: 43 },
  { code: 'tournament_winner', name: 'Champion', description: 'Win a tournament', icon: '🏆', category: 'tournaments', points: 100, sortOrder: 44 },
  
  // ==================== HANDICAP BADGES ====================
  { code: 'handicap_improve_3', name: 'On the Rise', description: 'Lower your handicap by 3 strokes', icon: '📈', category: 'handicap', points: 30, threshold: 3, sortOrder: 50 },
  { code: 'handicap_improve_5', name: 'Major Improvement', description: 'Lower your handicap by 5 strokes', icon: '🎯', category: 'handicap', points: 50, threshold: 5, sortOrder: 51 },
  { code: 'single_digit', name: 'Single Digit', description: 'Reach single-digit handicap (under 10)', icon: '🌟', category: 'handicap', points: 80, threshold: 9, sortOrder: 52 },
  
  // ==================== SOCIAL BADGES ====================
  { code: 'group_member', name: 'Team Player', description: 'Join a golfer group', icon: '👥', category: 'social', points: 10, threshold: 1, sortOrder: 60 },
  { code: 'group_leader', name: 'Group Captain', description: 'Create a golfer group', icon: '👨‍✈️', category: 'social', points: 30, threshold: 1, sortOrder: 61 },
  
  // ==================== SPECIAL BADGES ====================
  { code: 'early_bird', name: 'Early Bird', description: 'Complete a round before 7 AM', icon: '🌅', category: 'special', points: 20, sortOrder: 70 },
  { code: 'sunset_golfer', name: 'Sunset Golfer', description: 'Complete a round after 6 PM', icon: '🌇', category: 'special', points: 20, sortOrder: 71 },
];

// Seed achievements if they don't exist
async function ensureAchievementsSeeded() {
  try {
    const count = await db.achievement.count();
    if (count === 0) {
      console.log('Seeding achievements...');
      for (const achievement of ACHIEVEMENT_DEFINITIONS) {
        await db.achievement.create({
          data: {
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            points: achievement.points,
            holesRequired: achievement.holesRequired || null,
            threshold: achievement.threshold || null,
            sortOrder: achievement.sortOrder,
          },
        });
      }
      console.log(`Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
    }
  } catch (error) {
    console.error('Error seeding achievements:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    // Ensure achievements are seeded
    await ensureAchievementsSeeded();
    
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
    
    // Calculate level based on points - more challenging thresholds
    const LEVELS = [
      { level: 'Beginner', minPoints: 0 },
      { level: 'Amateur', minPoints: 100 },
      { level: 'Intermediate', minPoints: 250 },
      { level: 'Advanced', minPoints: 450 },
      { level: 'Expert', minPoints: 700 },
      { level: 'Master', minPoints: 1000 },
      { level: 'Legend', minPoints: 1500 },
      { level: 'Immortal', minPoints: 2000 },
    ];
    
    let level = 'Beginner';
    let nextLevel = 'Amateur';
    let pointsToNext = 100 - totalPoints;
    
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVELS[i].minPoints) {
        level = LEVELS[i].level;
        if (i < LEVELS.length - 1) {
          nextLevel = LEVELS[i + 1].level;
          pointsToNext = LEVELS[i + 1].minPoints - totalPoints;
        } else {
          nextLevel = 'Max Level!';
          pointsToNext = 0;
        }
        break;
      }
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

// Helper to award an achievement
async function awardAchievement(userId: string, code: string): Promise<boolean> {
  try {
    const achievement = await db.achievement.findUnique({ where: { code } });
    if (!achievement) return false;
    
    const existing = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } }
    });
    if (existing) return false;
    
    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id }
    });
    return true;
  } catch {
    return false;
  }
}

// POST - Re-check and award all eligible achievements for a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    // Ensure achievements are seeded
    await ensureAchievementsSeeded();
    
    const awardedBadges: string[] = [];
    
    // Get all completed rounds for the user
    const rounds = await db.round.findMany({
      where: { userId, completed: true },
      select: { totalStrokes: true, holesPlayed: true, courseId: true, date: true, completedAt: true },
    });
    
    const roundCount = rounds.length;
    
    // Award round achievements
    if (roundCount >= 1 && await awardAchievement(userId, 'first_round')) awardedBadges.push('first_round');
    if (roundCount >= 5 && await awardAchievement(userId, 'rounds_5')) awardedBadges.push('rounds_5');
    if (roundCount >= 10 && await awardAchievement(userId, 'rounds_10')) awardedBadges.push('rounds_10');
    if (roundCount >= 25 && await awardAchievement(userId, 'rounds_25')) awardedBadges.push('rounds_25');
    if (roundCount >= 50 && await awardAchievement(userId, 'rounds_50')) awardedBadges.push('rounds_50');
    if (roundCount >= 100 && await awardAchievement(userId, 'rounds_100')) awardedBadges.push('rounds_100');
    
    // Get best scores per holes played
    const rounds9 = rounds.filter(r => r.holesPlayed === 9 && r.totalStrokes);
    const rounds18 = rounds.filter(r => r.holesPlayed === 18 && r.totalStrokes);
    
    const best9 = rounds9.length > 0 ? Math.min(...rounds9.map(r => r.totalStrokes!)) : null;
    const best18 = rounds18.length > 0 ? Math.min(...rounds18.map(r => r.totalStrokes!)) : null;
    
    // Award 18-hole scoring achievements
    if (best18 !== null) {
      if (best18 < 100 && await awardAchievement(userId, 'under_100_18')) awardedBadges.push('under_100_18');
      if (best18 < 90 && await awardAchievement(userId, 'under_90_18')) awardedBadges.push('under_90_18');
      if (best18 < 80 && await awardAchievement(userId, 'under_80_18')) awardedBadges.push('under_80_18');
      if (best18 <= 72 && await awardAchievement(userId, 'par_18')) awardedBadges.push('par_18');
    }
    
    // Award 9-hole scoring achievements
    if (best9 !== null) {
      if (best9 < 50 && await awardAchievement(userId, 'under_50_9')) awardedBadges.push('under_50_9');
      if (best9 < 45 && await awardAchievement(userId, 'under_45_9')) awardedBadges.push('under_45_9');
      if (best9 < 40 && await awardAchievement(userId, 'under_40_9')) awardedBadges.push('under_40_9');
    }
    
    // Course achievements
    const uniqueCourses = [...new Set(rounds.map(r => r.courseId))];
    if (uniqueCourses.length >= 3 && await awardAchievement(userId, 'courses_3')) awardedBadges.push('courses_3');
    if (uniqueCourses.length >= 5 && await awardAchievement(userId, 'courses_5')) awardedBadges.push('courses_5');
    if (uniqueCourses.length >= 10 && await awardAchievement(userId, 'courses_10')) awardedBadges.push('courses_10');
    
    // Home course achievement
    const courseCounts: Record<string, number> = {};
    rounds.forEach(r => {
      courseCounts[r.courseId] = (courseCounts[r.courseId] || 0) + 1;
    });
    if (Object.values(courseCounts).some(count => count >= 5)) {
      if (await awardAchievement(userId, 'home_course')) awardedBadges.push('home_course');
    }
    
    // Tournament achievements
    const tournamentCount = await db.tournamentParticipant.count({ where: { userId } });
    if (tournamentCount >= 1 && await awardAchievement(userId, 'first_tournament')) awardedBadges.push('first_tournament');
    if (tournamentCount >= 3 && await awardAchievement(userId, 'tournaments_3')) awardedBadges.push('tournaments_3');
    if (tournamentCount >= 5 && await awardAchievement(userId, 'tournaments_5')) awardedBadges.push('tournaments_5');
    
    // Special achievements - check round completion times
    for (const round of rounds) {
      // Use completedAt if available, otherwise fall back to date
      const timeToCheck = round.completedAt || round.date;
      if (timeToCheck) {
        const hour = new Date(timeToCheck).getHours();
        if (hour < 7 && await awardAchievement(userId, 'early_bird')) awardedBadges.push('early_bird');
        if (hour >= 18 && await awardAchievement(userId, 'sunset_golfer')) awardedBadges.push('sunset_golfer');
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      awardedBadges,
      message: awardedBadges.length > 0 
        ? `Awarded ${awardedBadges.length} new achievement(s)!` 
        : 'No new achievements to award'
    });
  } catch (error) {
    console.error('Error rechecking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to recheck achievements', details: String(error) },
      { status: 500 }
    );
  }
}
