import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/super-admin';

// Define table dependencies (child -> parent relationships)
// Tables are restored in order: parents first, then children
const TABLE_DEPENDENCIES: Record<string, string[]> = {
  // Tables with no dependencies (can be restored first)
  users: [],
  golf_courses: [],
  settings: [],
  golfer_groups: [],
  achievements: [],  // System-wide achievement definitions
  
  // Tables depending on users
  admin_permissions: ['users'],
  admin_sessions: ['users'],
  password_reset_tokens: ['users'],
  club_distances: ['users'],
  user_clubs: ['users'],
  favorites: ['users', 'golf_courses'],
  user_groups: ['users', 'golfer_groups'],
  user_achievements: ['users', 'achievements'],  // User's earned achievements
  
  // Tables depending on golf_courses
  course_holes: ['golf_courses'],
  course_tees: ['golf_courses'],
  tournaments: ['golf_courses'],
  
  // Tables depending on course_holes and course_tees
  course_hole_distances: ['course_holes', 'course_tees'],
  
  // Tables depending on users and golf_courses
  rounds: ['users', 'golf_courses'],
  
  // Tables depending on rounds
  round_scores: ['rounds'],
  
  // Tables depending on users (for messages)
  messages: ['users'],
  message_reads: ['messages', 'users'],
  
  // Tables depending on tournaments and users
  tournament_participants: ['tournaments', 'users'],

  // Tables depending on users and golf_courses (partner requests)
  golf_partner_requests: ['users', 'golf_courses'],
  golf_partner_request_participants: ['golf_partner_requests', 'users'],

  // Tables with no dependencies
  repair_shops: [],
};

// Get table names in correct restore order (topological sort)
function getTableRestoreOrder(): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  
  function visit(table: string, path: string[] = []) {
    if (visited.has(table)) return;
    if (path.includes(table)) return; // Circular dependency check
    
    const dependencies = TABLE_DEPENDENCIES[table] || [];
    for (const dep of dependencies) {
      visit(dep, [...path, table]);
    }
    
    visited.add(table);
    order.push(table);
  }
  
  // Visit all tables
  Object.keys(TABLE_DEPENDENCIES).forEach(table => visit(table));
  
  return order;
}

// Fetch all data from all tables using explicit Prisma calls
async function fetchAllData() {
  const data: Record<string, unknown[]> = {};
  const statistics: Record<string, number> = {};
  const errors: string[] = [];

  // Fetch each table explicitly
  try {
    data.users = await db.user.findMany();
    statistics.users = data.users.length;
  } catch (e) {
    errors.push(`users: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.users = [];
    statistics.users = 0;
  }

  try {
    data.golf_courses = await db.golfCourse.findMany();
    statistics.golf_courses = data.golf_courses.length;
  } catch (e) {
    errors.push(`golf_courses: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.golf_courses = [];
    statistics.golf_courses = 0;
  }

  try {
    data.settings = await db.setting.findMany();
    statistics.settings = data.settings.length;
  } catch (e) {
    errors.push(`settings: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.settings = [];
    statistics.settings = 0;
  }

  try {
    data.golfer_groups = await db.golferGroup.findMany();
    statistics.golfer_groups = data.golfer_groups.length;
  } catch (e) {
    errors.push(`golfer_groups: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.golfer_groups = [];
    statistics.golfer_groups = 0;
  }

  try {
    data.admin_permissions = await db.adminPermission.findMany();
    statistics.admin_permissions = data.admin_permissions.length;
  } catch (e) {
    errors.push(`admin_permissions: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.admin_permissions = [];
    statistics.admin_permissions = 0;
  }

  try {
    data.admin_sessions = await db.adminSession.findMany();
    statistics.admin_sessions = data.admin_sessions.length;
  } catch (e) {
    errors.push(`admin_sessions: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.admin_sessions = [];
    statistics.admin_sessions = 0;
  }

  try {
    data.password_reset_tokens = await db.passwordResetToken.findMany();
    statistics.password_reset_tokens = data.password_reset_tokens.length;
  } catch (e) {
    errors.push(`password_reset_tokens: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.password_reset_tokens = [];
    statistics.password_reset_tokens = 0;
  }

  try {
    data.club_distances = await db.clubDistance.findMany();
    statistics.club_distances = data.club_distances.length;
  } catch (e) {
    errors.push(`club_distances: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.club_distances = [];
    statistics.club_distances = 0;
  }

  try {
    data.user_clubs = await db.userClub.findMany();
    statistics.user_clubs = data.user_clubs.length;
  } catch (e) {
    errors.push(`user_clubs: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.user_clubs = [];
    statistics.user_clubs = 0;
  }

  try {
    data.favorites = await db.favorite.findMany();
    statistics.favorites = data.favorites.length;
  } catch (e) {
    errors.push(`favorites: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.favorites = [];
    statistics.favorites = 0;
  }

  try {
    data.user_groups = await db.userGroup.findMany();
    statistics.user_groups = data.user_groups.length;
  } catch (e) {
    errors.push(`user_groups: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.user_groups = [];
    statistics.user_groups = 0;
  }

  try {
    data.course_holes = await db.courseHole.findMany();
    statistics.course_holes = data.course_holes.length;
  } catch (e) {
    errors.push(`course_holes: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.course_holes = [];
    statistics.course_holes = 0;
  }

  try {
    data.course_tees = await db.courseTee.findMany();
    statistics.course_tees = data.course_tees.length;
  } catch (e) {
    errors.push(`course_tees: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.course_tees = [];
    statistics.course_tees = 0;
  }

  try {
    data.tournaments = await db.tournament.findMany();
    statistics.tournaments = data.tournaments.length;
  } catch (e) {
    errors.push(`tournaments: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.tournaments = [];
    statistics.tournaments = 0;
  }

  try {
    data.course_hole_distances = await db.courseHoleDistance.findMany();
    statistics.course_hole_distances = data.course_hole_distances.length;
  } catch (e) {
    errors.push(`course_hole_distances: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.course_hole_distances = [];
    statistics.course_hole_distances = 0;
  }

  try {
    data.rounds = await db.round.findMany();
    statistics.rounds = data.rounds.length;
  } catch (e) {
    errors.push(`rounds: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.rounds = [];
    statistics.rounds = 0;
  }

  try {
    data.round_scores = await db.roundScore.findMany();
    statistics.round_scores = data.round_scores.length;
  } catch (e) {
    errors.push(`round_scores: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.round_scores = [];
    statistics.round_scores = 0;
  }

  try {
    data.messages = await db.message.findMany();
    statistics.messages = data.messages.length;
  } catch (e) {
    errors.push(`messages: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.messages = [];
    statistics.messages = 0;
  }

  try {
    data.message_reads = await db.messageRead.findMany();
    statistics.message_reads = data.message_reads.length;
  } catch (e) {
    errors.push(`message_reads: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.message_reads = [];
    statistics.message_reads = 0;
  }

  try {
    data.tournament_participants = await db.tournamentParticipant.findMany();
    statistics.tournament_participants = data.tournament_participants.length;
  } catch (e) {
    errors.push(`tournament_participants: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.tournament_participants = [];
    statistics.tournament_participants = 0;
  }

  // Fetch achievements (system-wide definitions)
  try {
    data.achievements = await db.achievement.findMany();
    statistics.achievements = data.achievements.length;
  } catch (e) {
    errors.push(`achievements: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.achievements = [];
    statistics.achievements = 0;
  }

  // Fetch user achievements (user's earned achievements)
  try {
    data.user_achievements = await db.userAchievement.findMany();
    statistics.user_achievements = data.user_achievements.length;
  } catch (e) {
    errors.push(`user_achievements: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.user_achievements = [];
    statistics.user_achievements = 0;
  }

  // Fetch golf partner requests
  try {
    data.golf_partner_requests = await db.golfPartnerRequest.findMany();
    statistics.golf_partner_requests = data.golf_partner_requests.length;
  } catch (e) {
    errors.push(`golf_partner_requests: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.golf_partner_requests = [];
    statistics.golf_partner_requests = 0;
  }

  // Fetch golf partner request participants
  try {
    data.golf_partner_request_participants = await db.golfPartnerRequestParticipant.findMany();
    statistics.golf_partner_request_participants = data.golf_partner_request_participants.length;
  } catch (e) {
    errors.push(`golf_partner_request_participants: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.golf_partner_request_participants = [];
    statistics.golf_partner_request_participants = 0;
  }

  // Fetch repair shops
  try {
    data.repair_shops = await db.repairShop.findMany();
    statistics.repair_shops = data.repair_shops.length;
  } catch (e) {
    errors.push(`repair_shops: ${e instanceof Error ? e.message : 'Unknown error'}`);
    data.repair_shops = [];
    statistics.repair_shops = 0;
  }

  return { data, statistics, errors };
}

// GET /api/admin/backup - Export all database data as JSON
export async function GET(request: NextRequest) {
  try {
    console.log('Backup: Starting backup process...');
    
    // Verify admin session from cookie
    const token = request.cookies.get('session_token')?.value;
    
    if (!token) {
      console.log('Backup: No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      console.log('Backup: Invalid session or not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can backup
    if (!isSuperAdminEmail(session.user.email)) {
      console.log('Backup: Not super admin:', session.user.email);
      return NextResponse.json(
        { error: 'Super Admin access required for backup operations' },
        { status: 403 }
      );
    }

    console.log('Backup: Authorized user:', session.user.email);
    console.log('Backup: Fetching all data...');

    // Fetch all data
    const { data, statistics, errors } = await fetchAllData();

    console.log('Backup: Statistics:', statistics);
    if (errors.length > 0) {
      console.log('Backup: Errors encountered:', errors);
    }

    // Build backup object with metadata
    const backup = {
      version: '2.0',
      schemaVersion: '2.0',
      exportDate: new Date().toISOString(),
      exportedBy: session.user.name || session.user.email,
      statistics,
      tableOrder: getTableRestoreOrder(),
      data,
    };

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(backup, null, 2);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `jazel-backup-${dateStr}_${timeStr}.json`;
    
    console.log('Backup: Complete. Total records:', Object.values(statistics).reduce((a, b) => a + b, 0));
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
