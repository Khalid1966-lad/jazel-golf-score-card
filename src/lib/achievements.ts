import { db } from '@/lib/db';

// Achievement codes for easy reference
export const ACHIEVEMENT_CODES = {
  // Rounds
  FIRST_ROUND: 'first_round',
  ROUNDS_5: 'rounds_5',
  ROUNDS_10: 'rounds_10',
  ROUNDS_25: 'rounds_25',
  ROUNDS_50: 'rounds_50',
  ROUNDS_100: 'rounds_100',
  
  // Scoring 18 holes
  UNDER_100_18: 'under_100_18',
  UNDER_90_18: 'under_90_18',
  UNDER_80_18: 'under_80_18',
  PAR_18: 'par_18',
  
  // Scoring 9 holes
  UNDER_50_9: 'under_50_9',
  UNDER_45_9: 'under_45_9',
  UNDER_40_9: 'under_40_9',
  
  // Courses
  COURSES_3: 'courses_3',
  COURSES_5: 'courses_5',
  COURSES_10: 'courses_10',
  HOME_COURSE: 'home_course',
  
  // Tournaments
  FIRST_TOURNAMENT: 'first_tournament',
  TOURNAMENTS_3: 'tournaments_3',
  TOURNAMENTS_5: 'tournaments_5',
  PODIUM_FINISH: 'podium_finish',
  TOURNAMENT_WINNER: 'tournament_winner',
  
  // Handicap
  HANDICAP_IMPROVE_3: 'handicap_improve_3',
  HANDICAP_IMPROVE_5: 'handicap_improve_5',
  SINGLE_DIGIT: 'single_digit',
  
  // Social
  GROUP_MEMBER: 'group_member',
  GROUP_LEADER: 'group_leader',
  
  // Special
  EARLY_BIRD: 'early_bird',
  SUNSET_GOLFER: 'sunset_golfer',
} as const;

/**
 * Award an achievement to a user
 * Returns true if newly awarded, false if already had it
 */
export async function awardAchievement(userId: string, code: string): Promise<boolean> {
  try {
    const achievement = await db.achievement.findUnique({
      where: { code },
    });
    
    if (!achievement) {
      console.warn(`Achievement not found: ${code}`);
      return false;
    }
    
    // Check if user already has this achievement
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });
    
    if (existing) {
      return false; // Already earned
    }
    
    // Award the achievement
    await db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });
    
    console.log(`Achievement "${achievement.name}" awarded to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error awarding achievement ${code}:`, error);
    return false;
  }
}

/**
 * Check and award round-based achievements
 */
export async function checkRoundAchievements(userId: string): Promise<string[]> {
  const awardedCodes: string[] = [];
  
  try {
    // Get total completed rounds count
    const roundCount = await db.round.count({
      where: { userId, completed: true },
    });
    
    // Check each threshold
    if (roundCount >= 1) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.FIRST_ROUND);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.FIRST_ROUND);
    }
    
    if (roundCount >= 5) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.ROUNDS_5);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.ROUNDS_5);
    }
    
    if (roundCount >= 10) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.ROUNDS_10);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.ROUNDS_10);
    }
    
    if (roundCount >= 25) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.ROUNDS_25);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.ROUNDS_25);
    }
    
    if (roundCount >= 50) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.ROUNDS_50);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.ROUNDS_50);
    }
    
    if (roundCount >= 100) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.ROUNDS_100);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.ROUNDS_100);
    }
    
    return awardedCodes;
  } catch (error) {
    console.error('Error checking round achievements:', error);
    return awardedCodes;
  }
}

/**
 * Check and award scoring achievements based on score and holes played
 */
export async function checkScoreAchievements(
  userId: string, 
  score: number, 
  holesPlayed: number
): Promise<string[]> {
  const awardedCodes: string[] = [];
  
  try {
    if (holesPlayed === 18) {
      // 18-hole achievements
      if (score < 100) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_100_18);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_100_18);
      }
      
      if (score < 90) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_90_18);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_90_18);
      }
      
      if (score < 80) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_80_18);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_80_18);
      }
      
      if (score <= 72) { // Par or better (assuming par 72)
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.PAR_18);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.PAR_18);
      }
    } else if (holesPlayed === 9) {
      // 9-hole achievements
      if (score < 50) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_50_9);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_50_9);
      }
      
      if (score < 45) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_45_9);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_45_9);
      }
      
      if (score < 40) {
        const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.UNDER_40_9);
        if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.UNDER_40_9);
      }
    }
    
    return awardedCodes;
  } catch (error) {
    console.error('Error checking score achievements:', error);
    return awardedCodes;
  }
}

/**
 * Check and award course variety achievements
 */
export async function checkCourseAchievements(userId: string): Promise<string[]> {
  const awardedCodes: string[] = [];
  
  try {
    // Get unique courses played
    const uniqueCourses = await db.round.findMany({
      where: { userId, completed: true },
      select: { courseId: true },
      distinct: ['courseId'],
    });
    
    const courseCount = uniqueCourses.length;
    
    if (courseCount >= 3) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.COURSES_3);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.COURSES_3);
    }
    
    if (courseCount >= 5) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.COURSES_5);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.COURSES_5);
    }
    
    if (courseCount >= 10) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.COURSES_10);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.COURSES_10);
    }
    
    // Check home course (5 rounds at same course)
    const roundsPerCourse = await db.round.groupBy({
      by: ['courseId'],
      where: { userId, completed: true },
      _count: { id: true },
    });
    
    const hasHomeCourse = roundsPerCourse.some(r => r._count.id >= 5);
    if (hasHomeCourse) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.HOME_COURSE);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.HOME_COURSE);
    }
    
    return awardedCodes;
  } catch (error) {
    console.error('Error checking course achievements:', error);
    return awardedCodes;
  }
}

/**
 * Check and award tournament achievements
 */
export async function checkTournamentAchievements(
  userId: string, 
  tournamentCount?: number
): Promise<string[]> {
  const awardedCodes: string[] = [];
  
  try {
    // Get tournament count if not provided
    let count = tournamentCount;
    if (count === undefined) {
      count = await db.tournamentParticipant.count({
        where: { userId },
      });
    }
    
    if (count >= 1) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.FIRST_TOURNAMENT);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.FIRST_TOURNAMENT);
    }
    
    if (count >= 3) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.TOURNAMENTS_3);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.TOURNAMENTS_3);
    }
    
    if (count >= 5) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.TOURNAMENTS_5);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.TOURNAMENTS_5);
    }
    
    return awardedCodes;
  } catch (error) {
    console.error('Error checking tournament achievements:', error);
    return awardedCodes;
  }
}

/**
 * Check time-based achievements (early bird, sunset golfer)
 */
export async function checkTimeAchievements(userId: string, completedAt: Date): Promise<string[]> {
  const awardedCodes: string[] = [];
  
  try {
    const hour = completedAt.getHours();
    
    // Early bird: before 7 AM
    if (hour < 7) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.EARLY_BIRD);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.EARLY_BIRD);
    }
    
    // Sunset golfer: after 6 PM
    if (hour >= 18) {
      const awarded = await awardAchievement(userId, ACHIEVEMENT_CODES.SUNSET_GOLFER);
      if (awarded) awardedCodes.push(ACHIEVEMENT_CODES.SUNSET_GOLFER);
    }
    
    return awardedCodes;
  } catch (error) {
    console.error('Error checking time achievements:', error);
    return awardedCodes;
  }
}

/**
 * Get user's achievement progress
 * Returns unlocked achievements and progress toward locked ones
 */
export async function getUserAchievementProgress(userId: string) {
  try {
    // Get all achievements
    const allAchievements = await db.achievement.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    
    // Get user's earned achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    
    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));
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
    
    return {
      achievements,
      totalPoints,
      earnedCount: userAchievements.length,
      totalCount: allAchievements.length,
      level,
      nextLevel,
      pointsToNext: Math.max(0, pointsToNext),
    };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    throw error;
  }
}

/**
 * Run all achievement checks after a round is completed
 */
export async function checkAllRoundAchievements(
  userId: string, 
  score: number, 
  holesPlayed: number,
  completedAt: Date = new Date()
): Promise<string[]> {
  const allAwarded: string[] = [];
  
  const roundAchievements = await checkRoundAchievements(userId);
  allAwarded.push(...roundAchievements);
  
  const scoreAchievements = await checkScoreAchievements(userId, score, holesPlayed);
  allAwarded.push(...scoreAchievements);
  
  const courseAchievements = await checkCourseAchievements(userId);
  allAwarded.push(...courseAchievements);
  
  const timeAchievements = await checkTimeAchievements(userId, completedAt);
  allAwarded.push(...timeAchievements);
  
  return allAwarded;
}
