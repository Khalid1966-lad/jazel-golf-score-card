import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  // ==================== ROUNDS BADGES ====================
  {
    code: 'first_round',
    name: 'First Swing',
    description: 'Complete your first round',
    icon: '🏌️',
    category: 'rounds',
    points: 10,
    threshold: 1,
    sortOrder: 1,
  },
  {
    code: 'rounds_5',
    name: 'Getting Started',
    description: 'Complete 5 rounds',
    icon: '📅',
    category: 'rounds',
    points: 20,
    threshold: 5,
    sortOrder: 2,
  },
  {
    code: 'rounds_10',
    name: 'Regular Golfer',
    description: 'Complete 10 rounds',
    icon: '🥈',
    category: 'rounds',
    points: 30,
    threshold: 10,
    sortOrder: 3,
  },
  {
    code: 'rounds_25',
    name: 'Dedicated Player',
    description: 'Complete 25 rounds',
    icon: '🥇',
    category: 'rounds',
    points: 50,
    threshold: 25,
    sortOrder: 4,
  },
  {
    code: 'rounds_50',
    name: 'Golf Addict',
    description: 'Complete 50 rounds',
    icon: '🏆',
    category: 'rounds',
    points: 100,
    threshold: 50,
    sortOrder: 5,
  },
  {
    code: 'rounds_100',
    name: 'Golf Legend',
    description: 'Complete 100 rounds',
    icon: '👑',
    category: 'rounds',
    points: 200,
    threshold: 100,
    sortOrder: 6,
  },

  // ==================== SCORING BADGES (18 Holes) ====================
  {
    code: 'under_100_18',
    name: 'Century Breaker',
    description: 'Score under 100 on 18 holes',
    icon: '💯',
    category: 'scoring',
    points: 15,
    holesRequired: 18,
    threshold: 99,
    sortOrder: 10,
  },
  {
    code: 'under_90_18',
    name: 'Breaking 90',
    description: 'Score under 90 on 18 holes',
    icon: '🎯',
    category: 'scoring',
    points: 30,
    holesRequired: 18,
    threshold: 89,
    sortOrder: 11,
  },
  {
    code: 'under_80_18',
    name: 'Elite Golfer',
    description: 'Score under 80 on 18 holes',
    icon: '💎',
    category: 'scoring',
    points: 60,
    holesRequired: 18,
    threshold: 79,
    sortOrder: 12,
  },
  {
    code: 'par_18',
    name: 'Par Master',
    description: 'Shoot par or better on 18 holes',
    icon: '⭐',
    category: 'scoring',
    points: 100,
    holesRequired: 18,
    threshold: 72,
    sortOrder: 13,
  },

  // ==================== SCORING BADGES (9 Holes) ====================
  {
    code: 'under_50_9',
    name: 'Half Century',
    description: 'Score under 50 on 9 holes',
    icon: '🔥',
    category: 'scoring',
    points: 15,
    holesRequired: 9,
    threshold: 49,
    sortOrder: 20,
  },
  {
    code: 'under_45_9',
    name: 'Sharp Shooter',
    description: 'Score under 45 on 9 holes',
    icon: '🎯',
    category: 'scoring',
    points: 30,
    holesRequired: 9,
    threshold: 44,
    sortOrder: 21,
  },
  {
    code: 'under_40_9',
    name: 'Nine Hole Master',
    description: 'Score under 40 on 9 holes',
    icon: '💎',
    category: 'scoring',
    points: 60,
    holesRequired: 9,
    threshold: 39,
    sortOrder: 22,
  },

  // ==================== COURSES BADGES ====================
  {
    code: 'courses_3',
    name: 'Explorer',
    description: 'Play at 3 different courses',
    icon: '🗺️',
    category: 'courses',
    points: 20,
    threshold: 3,
    sortOrder: 30,
  },
  {
    code: 'courses_5',
    name: 'Traveler',
    description: 'Play at 5 different courses',
    icon: '✈️',
    category: 'courses',
    points: 40,
    threshold: 5,
    sortOrder: 31,
  },
  {
    code: 'courses_10',
    name: 'Moroccan Tour',
    description: 'Play at 10 different courses',
    icon: '🇲🇦',
    category: 'courses',
    points: 80,
    threshold: 10,
    sortOrder: 32,
  },
  {
    code: 'home_course',
    name: 'Home Course Hero',
    description: 'Play 5 rounds at the same course',
    icon: '🏠',
    category: 'courses',
    points: 25,
    threshold: 5,
    sortOrder: 33,
  },

  // ==================== TOURNAMENT BADGES ====================
  {
    code: 'first_tournament',
    name: 'Tournament Rookie',
    description: 'Enter your first tournament',
    icon: '🏟️',
    category: 'tournaments',
    points: 15,
    threshold: 1,
    sortOrder: 40,
  },
  {
    code: 'tournaments_3',
    name: 'Tournament Regular',
    description: 'Enter 3 tournaments',
    icon: '🎖️',
    category: 'tournaments',
    points: 30,
    threshold: 3,
    sortOrder: 41,
  },
  {
    code: 'tournaments_5',
    name: 'Competition Lover',
    description: 'Enter 5 tournaments',
    icon: '🏅',
    category: 'tournaments',
    points: 50,
    threshold: 5,
    sortOrder: 42,
  },
  {
    code: 'podium_finish',
    name: 'Podium Finish',
    description: 'Finish in top 3 of a tournament',
    icon: '🥉',
    category: 'tournaments',
    points: 60,
    sortOrder: 43,
  },
  {
    code: 'tournament_winner',
    name: 'Champion',
    description: 'Win a tournament',
    icon: '🏆',
    category: 'tournaments',
    points: 100,
    sortOrder: 44,
  },

  // ==================== HANDICAP BADGES ====================
  {
    code: 'handicap_improve_3',
    name: 'On the Rise',
    description: 'Lower your handicap by 3 strokes',
    icon: '📈',
    category: 'handicap',
    points: 30,
    threshold: 3,
    sortOrder: 50,
  },
  {
    code: 'handicap_improve_5',
    name: 'Major Improvement',
    description: 'Lower your handicap by 5 strokes',
    icon: '🎯',
    category: 'handicap',
    points: 50,
    threshold: 5,
    sortOrder: 51,
  },
  {
    code: 'single_digit',
    name: 'Single Digit',
    description: 'Reach single-digit handicap (under 10)',
    icon: '🌟',
    category: 'handicap',
    points: 80,
    threshold: 9,
    sortOrder: 52,
  },

  // ==================== SOCIAL BADGES ====================
  {
    code: 'group_member',
    name: 'Team Player',
    description: 'Join a golfer group',
    icon: '👥',
    category: 'social',
    points: 10,
    threshold: 1,
    sortOrder: 60,
  },
  {
    code: 'group_leader',
    name: 'Group Captain',
    description: 'Create a golfer group',
    icon: '👨‍✈️',
    category: 'social',
    points: 30,
    threshold: 1,
    sortOrder: 61,
  },

  // ==================== SPECIAL BADGES ====================
  {
    code: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a round before 11 AM',
    icon: '🌅',
    category: 'special',
    points: 20,
    sortOrder: 70,
  },
  {
    code: 'sunset_golfer',
    name: 'Sunset Golfer',
    description: 'Complete a round after 6 PM',
    icon: '🌇',
    category: 'special',
    points: 20,
    sortOrder: 71,
  },
];

async function main() {
  console.log('Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`Seeded ${achievements.length} achievements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
