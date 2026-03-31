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

  // ==================== BIRDIE BADGES ====================
  { code: 'first_birdie', name: 'First Birdie', description: 'Score a birdie on any hole', icon: '🐦', category: 'birdies', points: 15, threshold: 1, sortOrder: 80 },
  { code: 'birdie_hunter', name: 'Birdie Hunter', description: 'Score 5 birdies total', icon: '🦅', category: 'birdies', points: 25, threshold: 5, sortOrder: 81 },
  { code: 'birdie_bonanza', name: 'Birdie Bonanza', description: 'Score 10 birdies total', icon: '🦃', category: 'birdies', points: 30, threshold: 10, sortOrder: 82 },
  { code: 'birdie_master', name: 'Birdie Master', description: 'Score 25 birdies total', icon: '🦚', category: 'birdies', points: 50, threshold: 25, sortOrder: 83 },
  { code: 'birdie_king', name: 'Birdie King', description: 'Score 50 birdies total', icon: '👑', category: 'birdies', points: 80, threshold: 50, sortOrder: 84 },
  { code: 'birdie_streak', name: 'Birdie Streak', description: 'Score birdies on 2 consecutive holes', icon: '🔥', category: 'birdies', points: 25, sortOrder: 85 },

  // ==================== PAR BADGES ====================
  { code: 'first_par', name: 'First Par', description: 'Score a par on any hole', icon: '⛳', category: 'pars', points: 10, threshold: 1, sortOrder: 90 },
  { code: 'par_collector', name: 'Par Collector', description: 'Score 10 pars total', icon: '📋', category: 'pars', points: 15, threshold: 10, sortOrder: 91 },
  { code: 'par_machine', name: 'Par Machine', description: 'Score 25 pars total', icon: '⚙️', category: 'pars', points: 25, threshold: 25, sortOrder: 92 },
  { code: 'steady_eddy', name: 'Steady Eddy', description: 'Complete a round at exactly par', icon: '⚖️', category: 'pars', points: 40, sortOrder: 93 },
  { code: 'par_streak', name: 'Par Streak', description: 'Score 3 pars in a row', icon: '🔗', category: 'pars', points: 25, sortOrder: 94 },
  { code: 'par_perfect', name: 'Par Perfect', description: 'Score 5 pars in a row', icon: '✨', category: 'pars', points: 50, sortOrder: 95 },

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

  // ==================== PROFILE BADGES ====================
  { code: 'profile_complete', name: 'Profile Complete', description: 'Add name, city, and country', icon: '📝', category: 'profile', points: 10, sortOrder: 100 },
  { code: 'photo_added', name: 'Photo Added', description: 'Upload a profile photo', icon: '📷', category: 'profile', points: 15, sortOrder: 101 },
  { code: 'handicap_set', name: 'Handicap Set', description: 'Set your handicap', icon: '🎯', category: 'profile', points: 15, sortOrder: 102 },
  { code: 'first_club', name: 'First Club', description: 'Add your first club to My Bag', icon: '🏌️', category: 'profile', points: 10, sortOrder: 103 },
  { code: 'bag_ready', name: 'Bag Ready', description: 'Add 5+ clubs to My Bag', icon: '🎒', category: 'profile', points: 10, threshold: 5, sortOrder: 104 },

  // ==================== ON-COURSE BADGES ====================
  { code: 'fairway_finder', name: 'Fairway Finder', description: 'Hit 10 fairways total', icon: '🏌️', category: 'oncourse', points: 15, threshold: 10, sortOrder: 110 },
  { code: 'green_machine', name: 'Green Machine', description: 'Hit 10 greens in regulation', icon: '🏌️', category: 'oncourse', points: 15, threshold: 10, sortOrder: 111 },
  { code: 'bogey_free_9', name: 'Bogey Free 9', description: 'Complete 9 holes without a bogey', icon: '🛡️', category: 'oncourse', points: 25, sortOrder: 112 },

  // ==================== CONSISTENCY BADGES ====================
  { code: 'week_warrior', name: 'Week Warrior', description: 'Play 3 rounds in one week', icon: '📅', category: 'consistency', points: 20, sortOrder: 120 },
  { code: 'monthly_regular', name: 'Monthly Regular', description: 'Play 5 rounds in one month', icon: '📆', category: 'consistency', points: 25, sortOrder: 121 },
  { code: 'streak_starter', name: 'Streak Starter', description: 'Play 3 weeks in a row', icon: '🔥', category: 'consistency', points: 25, sortOrder: 122 },
  { code: 'weekend_golfer', name: 'Weekend Golfer', description: 'Play 5 rounds on weekends', icon: '🌅', category: 'consistency', points: 25, threshold: 5, sortOrder: 123 },

  // ==================== APP FEATURES BADGES ====================
  { code: 'gps_user', name: 'GPS User', description: 'Use the course map feature', icon: '🗺️', category: 'app', points: 15, sortOrder: 130 },
  { code: 'stat_tracker', name: 'Stat Tracker', description: 'View your statistics page', icon: '📊', category: 'app', points: 10, sortOrder: 131 },
  { code: 'guide_reader', name: 'Guide Reader', description: 'Visit the User Guide', icon: '📖', category: 'app', points: 10, sortOrder: 132 },

  // ==================== SOCIAL BADGES ====================
  { code: 'group_member', name: 'Team Player', description: 'Join a golfer group', icon: '👥', category: 'social', points: 10, threshold: 1, sortOrder: 60 },
  { code: 'group_leader', name: 'Group Captain', description: 'Create a golfer group', icon: '👨‍✈️', category: 'social', points: 30, threshold: 1, sortOrder: 61 },
  { code: 'friendly_golfer', name: 'Friendly Golfer', description: 'Play with 3 different partners', icon: '🤝', category: 'social', points: 15, threshold: 3, sortOrder: 62 },
  { code: 'group_player', name: 'Group Player', description: 'Play 3 rounds with group members', icon: '👥', category: 'social', points: 20, threshold: 3, sortOrder: 63 },
  { code: 'welcoming', name: 'Welcoming', description: 'Play with a first-time user', icon: '🎉', category: 'social', points: 20, sortOrder: 64 },

  // ==================== SPECIAL BADGES ====================
  { code: 'early_bird', name: 'Early Bird', description: 'Complete a round before 11 AM', icon: '🌅', category: 'special', points: 20, sortOrder: 70 },
  { code: 'sunset_golfer', name: 'Sunset Golfer', description: 'Complete a round after 6 PM', icon: '🌇', category: 'special', points: 20, sortOrder: 71 },
];

// Seed achievements if they don't exist, or update if definition changed
async function ensureAchievementsSeeded() {
  try {
    console.log('Syncing achievements...');
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      await db.achievement.upsert({
        where: { code: achievement.code },
        update: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          points: achievement.points,
          holesRequired: achievement.holesRequired || null,
          threshold: achievement.threshold || null,
          sortOrder: achievement.sortOrder,
        },
        create: {
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
    console.log(`Synced ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
  } catch (error) {
    console.error('Error syncing achievements:', error);
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

// Helper to remove an achievement
async function removeAchievement(userId: string, code: string): Promise<boolean> {
  try {
    const achievement = await db.achievement.findUnique({ where: { code } });
    if (!achievement) return false;

    const existing = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } }
    });
    if (!existing) return false;

    await db.userAchievement.delete({
      where: { userId_achievementId: { userId, achievementId: achievement.id } }
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

    // Get user data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, city: true, country: true, avatar: true, handicap: true }
    });

    // ==================== PROFILE BADGES ====================
    if (user) {
      if (user.name && user.city && user.country) {
        if (await awardAchievement(userId, 'profile_complete')) awardedBadges.push('profile_complete');
      }
      if (user.avatar) {
        if (await awardAchievement(userId, 'photo_added')) awardedBadges.push('photo_added');
      }
      if (user.handicap !== null && user.handicap !== undefined) {
        if (await awardAchievement(userId, 'handicap_set')) awardedBadges.push('handicap_set');
      }
    }

    // Club count for bag badges
    const clubCount = await db.userClub.count({ where: { userId } });
    if (clubCount >= 1 && await awardAchievement(userId, 'first_club')) awardedBadges.push('first_club');
    if (clubCount >= 5 && await awardAchievement(userId, 'bag_ready')) awardedBadges.push('bag_ready');

    // ==================== ROUNDS BADGES ====================
    const rounds = await db.round.findMany({
      where: { userId, completed: true },
      select: {
        totalStrokes: true,
        holesPlayed: true,
        courseId: true,
        date: true,
        completedAt: true,
        scores: true,
        playerNames: true,
        course: {
          select: {
            holes: {
              select: {
                holeNumber: true,
                par: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'asc' }
    });

    const roundCount = rounds.length;

    // Award round achievements
    if (roundCount >= 1 && await awardAchievement(userId, 'first_round')) awardedBadges.push('first_round');
    if (roundCount >= 5 && await awardAchievement(userId, 'rounds_5')) awardedBadges.push('rounds_5');
    if (roundCount >= 10 && await awardAchievement(userId, 'rounds_10')) awardedBadges.push('rounds_10');
    if (roundCount >= 25 && await awardAchievement(userId, 'rounds_25')) awardedBadges.push('rounds_25');
    if (roundCount >= 50 && await awardAchievement(userId, 'rounds_50')) awardedBadges.push('rounds_50');
    if (roundCount >= 100 && await awardAchievement(userId, 'rounds_100')) awardedBadges.push('rounds_100');

    // ==================== SCORING BADGES ====================
    const rounds9 = rounds.filter(r => r.holesPlayed === 9 && r.totalStrokes);
    const rounds18 = rounds.filter(r => r.holesPlayed === 18 && r.totalStrokes);

    const best9 = rounds9.length > 0 ? Math.min(...rounds9.map(r => r.totalStrokes!)) : null;
    const best18 = rounds18.length > 0 ? Math.min(...rounds18.map(r => r.totalStrokes!)) : null;

    // 18-hole scoring
    if (best18 !== null) {
      if (best18 < 100 && await awardAchievement(userId, 'under_100_18')) awardedBadges.push('under_100_18');
      if (best18 < 90 && await awardAchievement(userId, 'under_90_18')) awardedBadges.push('under_90_18');
      if (best18 < 80 && await awardAchievement(userId, 'under_80_18')) awardedBadges.push('under_80_18');
      if (best18 <= 72 && await awardAchievement(userId, 'par_18')) awardedBadges.push('par_18');
    }

    // 9-hole scoring
    if (best9 !== null) {
      if (best9 < 50 && await awardAchievement(userId, 'under_50_9')) awardedBadges.push('under_50_9');
      if (best9 < 45 && await awardAchievement(userId, 'under_45_9')) awardedBadges.push('under_45_9');
      if (best9 < 40 && await awardAchievement(userId, 'under_40_9')) awardedBadges.push('under_40_9');
    }

    // ==================== BIRDIE & PAR BADGES ====================
    let totalBirdies = 0;
    let totalPars = 0;
    let totalFairways = 0;
    let totalGreens = 0;
    let hasBirdieStreak = false;
    let hasParStreak3 = false;
    let hasParStreak5 = false;
    let hasBogeyFree9 = false;

    // Analyze all round scores - ONLY for the connected user (playerIndex === 0)
    console.log(`[Achievements] Analyzing ${rounds.length} rounds for user ${userId}`);
    for (const round of rounds) {
      if (round.scores && Array.isArray(round.scores)) {
        // Build a map of hole number to par from the course holes
        const holeParMap = new Map<number, number>();
        if (round.course && round.course.holes) {
          round.course.holes.forEach(h => {
            holeParMap.set(h.holeNumber, h.par);
          });
        }

        // Filter to only the connected user's scores (playerIndex === 0)
        const scores = round.scores as Array<{
          strokes: number;
          par?: number;
          fairwayHit?: boolean;
          greenInReg?: boolean;
          playerIndex?: number;
          holeNumber?: number;
        }>;
        const userScores = scores.filter(s => (s.playerIndex ?? 0) === 0);
        console.log(`[Achievements] Round has ${scores.length} total scores, ${userScores.length} for main player (playerIndex=0)`);

        // Sort by hole number to maintain order for streaks
        const sortedScores = [...userScores].sort((a, b) => (a.holeNumber || 0) - (b.holeNumber || 0));

        // Count birdies, pars, fairways, greens
        let consecutiveBirdies = 0;
        let consecutivePars = 0;
        let bogeyFreeCount = 0;

        for (const score of sortedScores) {
          // Get par from course holes, not from score (par is not stored in RoundScore)
          const holeNumber = score.holeNumber || 1;
          const par = holeParMap.get(holeNumber) || 4;
          const diff = score.strokes - par;

          // Birdie check
          if (diff <= -1) {
            totalBirdies++;
            consecutiveBirdies++;
            consecutivePars = 0;
            if (consecutiveBirdies >= 2) hasBirdieStreak = true;
          } else {
            consecutiveBirdies = 0;
          }

          // Par check
          if (diff === 0) {
            totalPars++;
            consecutivePars++;
            bogeyFreeCount++;
            if (consecutivePars >= 3) hasParStreak3 = true;
            if (consecutivePars >= 5) hasParStreak5 = true;
          } else {
            consecutivePars = 0;
            if (diff > 0) bogeyFreeCount = -999; // Reset if bogey or worse
          }

          // Fairway and green
          if (score.fairwayHit) totalFairways++;
          if (score.greenInReg) totalGreens++;
        }

        // Check for bogey-free 9 holes (first 9 or second 9 of 18)
        if (round.holesPlayed === 9 || round.holesPlayed === 18) {
          const scoresToCheck = round.holesPlayed === 9 ? sortedScores : sortedScores.slice(0, 9);
          const isBogeyFree = scoresToCheck.every(s => {
            const holeNum = s.holeNumber || 1;
            const par = holeParMap.get(holeNum) || 4;
            return s.strokes <= par;
          });
          if (isBogeyFree) hasBogeyFree9 = true;
        }
      }
    }

    console.log(`[Achievements] Total birdies for user: ${totalBirdies}, Total pars: ${totalPars}`);
    console.log(`[Achievements] Birdie streak: ${hasBirdieStreak}, Par streaks: 3=${hasParStreak3}, 5=${hasParStreak5}`);

    // Award birdie badges
    if (totalBirdies >= 1 && await awardAchievement(userId, 'first_birdie')) awardedBadges.push('first_birdie');
    if (totalBirdies >= 5 && await awardAchievement(userId, 'birdie_hunter')) awardedBadges.push('birdie_hunter');
    if (totalBirdies >= 10 && await awardAchievement(userId, 'birdie_bonanza')) awardedBadges.push('birdie_bonanza');
    if (totalBirdies >= 25 && await awardAchievement(userId, 'birdie_master')) awardedBadges.push('birdie_master');
    if (totalBirdies >= 50 && await awardAchievement(userId, 'birdie_king')) awardedBadges.push('birdie_king');
    if (hasBirdieStreak && await awardAchievement(userId, 'birdie_streak')) awardedBadges.push('birdie_streak');

    // Award par badges
    if (totalPars >= 1 && await awardAchievement(userId, 'first_par')) awardedBadges.push('first_par');
    if (totalPars >= 10 && await awardAchievement(userId, 'par_collector')) awardedBadges.push('par_collector');
    if (totalPars >= 25 && await awardAchievement(userId, 'par_machine')) awardedBadges.push('par_machine');
    if (hasParStreak3 && await awardAchievement(userId, 'par_streak')) awardedBadges.push('par_streak');
    if (hasParStreak5 && await awardAchievement(userId, 'par_perfect')) awardedBadges.push('par_perfect');

    // Steady Eddy - round at exactly par (check totalStrokes against course par)
    for (const round of rounds) {
      if (round.totalStrokes && round.holesPlayed) {
        // Assume 36 par for 9 holes, 72 for 18 holes
        const expectedPar = round.holesPlayed === 9 ? 36 : 72;
        if (round.totalStrokes === expectedPar) {
          if (await awardAchievement(userId, 'steady_eddy')) awardedBadges.push('steady_eddy');
          break;
        }
      }
    }

    // ==================== ON-COURSE BADGES ====================
    if (totalFairways >= 10 && await awardAchievement(userId, 'fairway_finder')) awardedBadges.push('fairway_finder');
    if (totalGreens >= 10 && await awardAchievement(userId, 'green_machine')) awardedBadges.push('green_machine');
    if (hasBogeyFree9 && await awardAchievement(userId, 'bogey_free_9')) awardedBadges.push('bogey_free_9');

    // ==================== COURSES BADGES ====================
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

    // ==================== CONSISTENCY BADGES ====================
    // Initialize consistency tracking variables (needed for both awarding and validation)
    const roundsByWeek: Record<string, number> = {};
    const roundsByMonth: Record<string, number> = {};
    const roundsByDay: Record<string, number> = {};
    let consecutiveWeeks = 1;

    if (rounds.length >= 3) {
      // Check for rounds in same week
      rounds.forEach(r => {
        const date = new Date(r.date || r.completedAt || new Date());
        const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toISOString().split('T')[0];

        roundsByWeek[weekKey] = (roundsByWeek[weekKey] || 0) + 1;
        roundsByMonth[monthKey] = (roundsByMonth[monthKey] || 0) + 1;

        // Weekend check (0 = Sunday, 6 = Saturday)
        if (date.getDay() === 0 || date.getDay() === 6) {
          roundsByDay[dayKey] = (roundsByDay[dayKey] || 0) + 1;
        }
      });

      // Week warrior
      if (Object.values(roundsByWeek).some(count => count >= 3)) {
        if (await awardAchievement(userId, 'week_warrior')) awardedBadges.push('week_warrior');
      }

      // Monthly regular
      if (Object.values(roundsByMonth).some(count => count >= 5)) {
        if (await awardAchievement(userId, 'monthly_regular')) awardedBadges.push('monthly_regular');
      }

      // Streak starter - 3 consecutive weeks
      const weeks = Object.keys(roundsByWeek).sort();
      for (let i = 1; i < weeks.length; i++) {
        if (isConsecutiveWeek(weeks[i-1], weeks[i])) {
          consecutiveWeeks++;
          if (consecutiveWeeks >= 3) break;
        } else {
          consecutiveWeeks = 1;
        }
      }
      if (consecutiveWeeks >= 3 && await awardAchievement(userId, 'streak_starter')) awardedBadges.push('streak_starter');

      // Weekend golfer
      const weekendRounds = Object.values(roundsByDay).reduce((sum, count) => sum + count, 0);
      if (weekendRounds >= 5 && await awardAchievement(userId, 'weekend_golfer')) awardedBadges.push('weekend_golfer');
    }

    // ==================== TOURNAMENT BADGES ====================
    const tournamentCount = await db.tournamentParticipant.count({ where: { userId } });
    if (tournamentCount >= 1 && await awardAchievement(userId, 'first_tournament')) awardedBadges.push('first_tournament');
    if (tournamentCount >= 3 && await awardAchievement(userId, 'tournaments_3')) awardedBadges.push('tournaments_3');
    if (tournamentCount >= 5 && await awardAchievement(userId, 'tournaments_5')) awardedBadges.push('tournaments_5');

    // ==================== SOCIAL BADGES ====================
    // Group membership
    const groupMembership = await db.userGroup.count({ where: { userId } });
    if (groupMembership >= 1 && await awardAchievement(userId, 'group_member')) awardedBadges.push('group_member');

    // Group leadership - skip for now (no createdById field in GolferGroup model)
    // Users can still get this badge through other means if implemented later

    // Friendly Golfer - play with 3 different partners
    const allPlayerNames = new Set<string>();
    rounds.forEach(r => {
      if (r.playerNames) {
        try {
          const names = JSON.parse(r.playerNames as string);
          if (Array.isArray(names)) {
            names.forEach((name: string) => {
              if (name && typeof name === 'string') allPlayerNames.add(name.toLowerCase().trim());
            });
          }
        } catch { /* ignore parse errors */ }
      }
    });
    if (allPlayerNames.size >= 3 && await awardAchievement(userId, 'friendly_golfer')) awardedBadges.push('friendly_golfer');

    // Group Player - play 3 rounds with group members (check if round has group participants)
    // This requires checking if any round participants were from user's groups
    const userGroups = await db.userGroup.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const userGroupIds = userGroups.map(g => g.groupId);

    if (userGroupIds.length > 0) {
      // Get all group members
      const groupMembers = await db.userGroup.findMany({
        where: { groupId: { in: userGroupIds } },
        select: { userId: true }
      });
      const groupMemberIds = new Set(groupMembers.map(m => m.userId).filter(id => id !== userId));

      // Count rounds played with group members (via playerNames matching group member names)
      // This is a simplified check - we count rounds that have playerNames
      let roundsWithOthers = 0;
      for (const round of rounds) {
        if (round.playerNames) {
          roundsWithOthers++;
        }
      }
      // Approximate: if played 3+ rounds with other players, award group player
      if (roundsWithOthers >= 3 && groupMemberIds.size > 0 && await awardAchievement(userId, 'group_player')) {
        awardedBadges.push('group_player');
      }
    }

    // ==================== APP BADGES ====================
    // These are tracked client-side and awarded when the action occurs
    // For now, we check if the user has any activity that suggests app usage

    // GPS User - check if user has any round with weather data (implies GPS was used)
    // GPS User badge is awarded when user opens the course map (handled in CourseMap component)
    // Stat Tracker - check if user has completed rounds (implies stats viewed)
    if (roundCount >= 1 && await awardAchievement(userId, 'stat_tracker')) awardedBadges.push('stat_tracker');

    // Guide Reader - check if user has profile complete (implies guide was consulted)
    if (user?.name && user?.city && user?.country && await awardAchievement(userId, 'guide_reader')) {
      awardedBadges.push('guide_reader');
    }

    // ==================== SPECIAL BADGES ====================
    for (const round of rounds) {
      const timeToCheck = round.completedAt || round.date;
      if (timeToCheck) {
        const hour = new Date(timeToCheck).getHours();
        if (hour < 11 && await awardAchievement(userId, 'early_bird')) awardedBadges.push('early_bird');
        if (hour >= 18 && await awardAchievement(userId, 'sunset_golfer')) awardedBadges.push('sunset_golfer');
      }
    }

    // ==================== VALIDATION: Remove incorrectly awarded badges ====================
    // Build list of badges the user SHOULD have based on calculations above
    // IMPORTANT: Only include badges that can be validated programmatically
    // Badges like 'welcoming', 'group_leader', 'podium_finish', 'tournament_winner' cannot be validated here
    // and should NOT be removed even if not in this set

    const NON_VALIDATABLE_BADGES = new Set([
      'welcoming',           // Requires tracking first-time user plays - complex validation
      'group_leader',        // Requires checking GolferGroup.createdById - not implemented
      'podium_finish',       // Requires tournament results calculation
      'tournament_winner',   // Requires tournament results calculation
      'handicap_improve_3',  // Requires historical handicap tracking
      'handicap_improve_5',  // Requires historical handicap tracking
      'single_digit',        // Could be validated but handicap may have changed since award
      'gps_user',            // Awarded when user opens course map - not round-based
    ]);

    const validBadgeCodes = new Set<string>([
      // Rounds
      ...(roundCount >= 1 ? ['first_round'] : []),
      ...(roundCount >= 5 ? ['rounds_5'] : []),
      ...(roundCount >= 10 ? ['rounds_10'] : []),
      ...(roundCount >= 25 ? ['rounds_25'] : []),
      ...(roundCount >= 50 ? ['rounds_50'] : []),
      ...(roundCount >= 100 ? ['rounds_100'] : []),
      // Scoring 18
      ...(best18 !== null && best18 < 100 ? ['under_100_18'] : []),
      ...(best18 !== null && best18 < 90 ? ['under_90_18'] : []),
      ...(best18 !== null && best18 < 80 ? ['under_80_18'] : []),
      ...(best18 !== null && best18 <= 72 ? ['par_18'] : []),
      // Scoring 9
      ...(best9 !== null && best9 < 50 ? ['under_50_9'] : []),
      ...(best9 !== null && best9 < 45 ? ['under_45_9'] : []),
      ...(best9 !== null && best9 < 40 ? ['under_40_9'] : []),
      // Birdies - ONLY count connected user's scores (playerIndex === 0)
      ...(totalBirdies >= 1 ? ['first_birdie'] : []),
      ...(totalBirdies >= 5 ? ['birdie_hunter'] : []),
      ...(totalBirdies >= 10 ? ['birdie_bonanza'] : []),
      ...(totalBirdies >= 25 ? ['birdie_master'] : []),
      ...(totalBirdies >= 50 ? ['birdie_king'] : []),
      ...(hasBirdieStreak ? ['birdie_streak'] : []),
      // Pars - ONLY count connected user's scores (playerIndex === 0)
      ...(totalPars >= 1 ? ['first_par'] : []),
      ...(totalPars >= 10 ? ['par_collector'] : []),
      ...(totalPars >= 25 ? ['par_machine'] : []),
      ...(hasParStreak3 ? ['par_streak'] : []),
      ...(hasParStreak5 ? ['par_perfect'] : []),
      // Courses
      ...(uniqueCourses.length >= 3 ? ['courses_3'] : []),
      ...(uniqueCourses.length >= 5 ? ['courses_5'] : []),
      ...(uniqueCourses.length >= 10 ? ['courses_10'] : []),
      ...(Object.values(courseCounts).some(count => count >= 5) ? ['home_course'] : []),
      // Tournaments
      ...(tournamentCount >= 1 ? ['first_tournament'] : []),
      ...(tournamentCount >= 3 ? ['tournaments_3'] : []),
      ...(tournamentCount >= 5 ? ['tournaments_5'] : []),
      // On-Course
      ...(totalFairways >= 10 ? ['fairway_finder'] : []),
      ...(totalGreens >= 10 ? ['green_machine'] : []),
      ...(hasBogeyFree9 ? ['bogey_free_9'] : []),
      // Profile
      ...(user && user.name && user.city && user.country ? ['profile_complete'] : []),
      ...(user && user.avatar ? ['photo_added'] : []),
      ...(user && user.handicap !== null && user.handicap !== undefined ? ['handicap_set'] : []),
      ...(clubCount >= 1 ? ['first_club'] : []),
      ...(clubCount >= 5 ? ['bag_ready'] : []),
      // App
      // gps_user is awarded when map is opened - not validated here
      ...(roundCount >= 1 ? ['stat_tracker'] : []),
      ...(user && user.name && user.city && user.country ? ['guide_reader'] : []),
      // Social
      ...(groupMembership >= 1 ? ['group_member'] : []),
      ...(allPlayerNames.size >= 3 ? ['friendly_golfer'] : []),
      // Consistency - calculated above
      ...(Object.values(roundsByWeek).some(count => count >= 3) ? ['week_warrior'] : []),
      ...(Object.values(roundsByMonth).some(count => count >= 5) ? ['monthly_regular'] : []),
      ...(consecutiveWeeks >= 3 ? ['streak_starter'] : []),
      ...(Object.values(roundsByDay).reduce((sum, count) => sum + count, 0) >= 5 ? ['weekend_golfer'] : []),
    ]);

    // Check for steady_eddy separately (needs round iteration)
    for (const round of rounds) {
      if (round.totalStrokes && round.holesPlayed) {
        const expectedPar = round.holesPlayed === 9 ? 36 : 72;
        if (round.totalStrokes === expectedPar) {
          validBadgeCodes.add('steady_eddy');
          break;
        }
      }
    }

    // Check for Early Bird and Sunset badges
    for (const round of rounds) {
      const timeToCheck = round.completedAt || round.date;
      if (timeToCheck) {
        const hour = new Date(timeToCheck).getHours();
        if (hour < 11) validBadgeCodes.add('early_bird');
        if (hour >= 18) validBadgeCodes.add('sunset_golfer');
      }
    }

    console.log(`[Achievements] Valid badge codes for validation: ${JSON.stringify([...validBadgeCodes])}`);

    // Get all earned achievements and remove any that shouldn't be there
    const earnedAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: { select: { code: true } } }
    });

    console.log(`[Achievements] User has ${earnedAchievements.length} earned achievements`);

    const removedBadges: string[] = [];
    for (const earned of earnedAchievements) {
      const badgeCode = earned.achievement.code;
      // Skip validation for non-validatable badges - they should never be removed
      if (NON_VALIDATABLE_BADGES.has(badgeCode)) {
        console.log(`[Achievements] Skipping non-validatable badge: ${badgeCode}`);
        continue;
      }
      if (!validBadgeCodes.has(badgeCode)) {
        console.log(`[Achievements] Badge ${badgeCode} should NOT be earned - removing`);
        // This badge shouldn't be there - remove it
        if (await removeAchievement(userId, badgeCode)) {
          removedBadges.push(badgeCode);
          console.log(`[Achievements] Successfully removed badge: ${badgeCode}`);
        } else {
          console.log(`[Achievements] Failed to remove badge: ${badgeCode}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      awardedBadges,
      removedBadges,
      message: awardedBadges.length > 0
        ? `Awarded ${awardedBadges.length} new achievement(s)!`
        : removedBadges.length > 0
          ? `Removed ${removedBadges.length} incorrect badge(s)`
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

// Helper functions for date calculations
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function isConsecutiveWeek(week1: string, week2: string): boolean {
  // Format: YYYY-Wnn
  const [y1, w1] = week1.split('-W').map(Number);
  const [y2, w2] = week2.split('-W').map(Number);

  if (y1 === y2) {
    return w2 - w1 === 1;
  } else if (y2 - y1 === 1) {
    // Check if last week of y1 and first week of y2
    return w1 === 52 && w2 === 1;
  }
  return false;
}
