import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/super-admin';

// Map table names to Prisma model names
const TABLE_TO_MODEL: Record<string, string> = {
  users: 'user',
  golf_courses: 'golfCourse',
  settings: 'setting',
  golfer_groups: 'golferGroup',
  achievements: 'achievement',
  admin_permissions: 'adminPermission',
  admin_sessions: 'adminSession',
  password_reset_tokens: 'passwordResetToken',
  club_distances: 'clubDistance',
  user_clubs: 'userClub',
  favorites: 'favorite',
  user_groups: 'userGroup',
  user_achievements: 'userAchievement',
  course_holes: 'courseHole',
  course_tees: 'courseTee',
  tournaments: 'tournament',
  course_hole_distances: 'courseHoleDistance',
  rounds: 'round',
  round_scores: 'roundScore',
  messages: 'message',
  message_reads: 'messageRead',
  tournament_participants: 'tournamentParticipant',
  golf_partner_requests: 'golfPartnerRequest',
  golf_partner_request_participants: 'golfPartnerRequestParticipant',
};

// Define table dependencies (child -> parent relationships)
const TABLE_DEPENDENCIES: Record<string, string[]> = {
  users: [],
  golf_courses: [],
  settings: [],
  golfer_groups: [],
  achievements: [],  // System-wide achievement definitions
  admin_permissions: ['users'],
  admin_sessions: ['users'],
  password_reset_tokens: ['users'],
  club_distances: ['users'],
  user_clubs: ['users'],
  favorites: ['users', 'golf_courses'],
  user_groups: ['users', 'golfer_groups'],
  user_achievements: ['users', 'achievements'],  // User's earned achievements
  course_holes: ['golf_courses'],
  course_tees: ['golf_courses'],
  tournaments: ['golf_courses'],
  course_hole_distances: ['course_holes', 'course_tees'],
  rounds: ['users', 'golf_courses'],
  round_scores: ['rounds'],
  messages: ['users'],
  message_reads: ['messages', 'users'],
  tournament_participants: ['tournaments', 'users'],

  // Tables depending on users and golf_courses (partner requests)
  golf_partner_requests: ['users', 'golf_courses'],
  golf_partner_request_participants: ['golf_partner_requests', 'users'],
};

// Get table names in correct restore order (topological sort - parents first)
function getTableRestoreOrder(): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  
  function visit(table: string, path: string[] = []) {
    if (visited.has(table)) return;
    if (path.includes(table)) return;
    
    const dependencies = TABLE_DEPENDENCIES[table] || [];
    for (const dep of dependencies) {
      visit(dep, [...path, table]);
    }
    
    visited.add(table);
    order.push(table);
  }
  
  Object.keys(TABLE_DEPENDENCIES).forEach(table => visit(table));
  return order;
}

// Get clear order (reverse of restore order - children first)
function getTableClearOrder(): string[] {
  return [...getTableRestoreOrder()].reverse();
}

// Get valid field names for a Prisma model from the DMMF
function getModelFields(modelName: string): Set<string> {
  try {
    const dmmf = db._baseDmmf || (db as unknown as { _dmmf: unknown })._dmmf;
    if (!dmmf) return new Set();
    
    const datamodel = (dmmf as { datamodel?: { models?: unknown[] } }).datamodel;
    const models = datamodel?.models || [];
    const model = models.find((m: { name: string }) => m.name === modelName);
    
    if (!model) return new Set();
    
    const fields = (model as { fields?: unknown[] }).fields || [];
    return new Set(fields.map((f: { name: string }) => f.name));
  } catch {
    return new Set();
  }
}

// Filter record to only include valid fields for the current schema
function filterRecordFields(
  record: Record<string, unknown>,
  validFields: Set<string>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(record)) {
    if (validFields.size === 0 || validFields.has(key)) {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

// Clear all tables using explicit Prisma calls
async function clearAllTables(): Promise<{ cleared: string[]; errors: string[] }> {
  const cleared: string[] = [];
  const errors: string[] = [];
  
  // Clear in reverse dependency order (children first)
  const clearOrder = getTableClearOrder();
  
  for (const tableName of clearOrder) {
    try {
      const model = TABLE_TO_MODEL[tableName];
      switch (model) {
        case 'user': await db.user.deleteMany(); break;
        case 'golfCourse': await db.golfCourse.deleteMany(); break;
        case 'setting': await db.setting.deleteMany(); break;
        case 'golferGroup': await db.golferGroup.deleteMany(); break;
        case 'achievement': await db.achievement.deleteMany(); break;
        case 'adminPermission': await db.adminPermission.deleteMany(); break;
        case 'adminSession': await db.adminSession.deleteMany(); break;
        case 'passwordResetToken': await db.passwordResetToken.deleteMany(); break;
        case 'clubDistance': await db.clubDistance.deleteMany(); break;
        case 'userClub': await db.userClub.deleteMany(); break;
        case 'favorite': await db.favorite.deleteMany(); break;
        case 'userGroup': await db.userGroup.deleteMany(); break;
        case 'userAchievement': await db.userAchievement.deleteMany(); break;
        case 'courseHole': await db.courseHole.deleteMany(); break;
        case 'courseTee': await db.courseTee.deleteMany(); break;
        case 'tournament': await db.tournament.deleteMany(); break;
        case 'courseHoleDistance': await db.courseHoleDistance.deleteMany(); break;
        case 'round': await db.round.deleteMany(); break;
        case 'roundScore': await db.roundScore.deleteMany(); break;
        case 'message': await db.message.deleteMany(); break;
        case 'messageRead': await db.messageRead.deleteMany(); break;
        case 'tournamentParticipant': await db.tournamentParticipant.deleteMany(); break;
        case 'golfPartnerRequestParticipant': await db.golfPartnerRequestParticipant.deleteMany(); break;
        case 'golfPartnerRequest': await db.golfPartnerRequest.deleteMany(); break;
      }
      cleared.push(tableName);
      console.log(`Cleared table: ${tableName}`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`Failed to clear ${tableName}: ${errorMsg}`);
      console.warn(`Could not clear table ${tableName}:`, errorMsg);
    }
  }
  
  return { cleared, errors };
}

// Insert records for a table using explicit Prisma calls with upsert
async function insertRecords(
  tableName: string,
  records: Record<string, unknown>[]
): Promise<{ count: number; errors: string[]; filteredFields: string[] }> {
  const model = TABLE_TO_MODEL[tableName];
  const validFields = getModelFields(model);
  let count = 0;
  const errors: string[] = [];
  const filteredFields: string[] = [];
  
  // Track which fields were filtered
  if (validFields.size > 0) {
    for (const record of records) {
      for (const key of Object.keys(record)) {
        if (!validFields.has(key) && !filteredFields.includes(key)) {
          filteredFields.push(key);
        }
      }
    }
  }
  
  for (const record of records) {
    try {
      const filteredRecord = validFields.size > 0 
        ? filterRecordFields(record, validFields) 
        : record;
      
      // Use upsert to handle existing records (by id)
      const id = filteredRecord.id as string;
      
      switch (model) {
        case 'user': 
          await db.user.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.user.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.user.create>[0]['data']
          }); 
          break;
        case 'golfCourse': 
          await db.golfCourse.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.golfCourse.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.golfCourse.create>[0]['data']
          }); 
          break;
        case 'setting': 
          await db.setting.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.setting.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.setting.create>[0]['data']
          }); 
          break;
        case 'golferGroup': 
          await db.golferGroup.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.golferGroup.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.golferGroup.create>[0]['data']
          }); 
          break;
        case 'achievement': 
          await db.achievement.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.achievement.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.achievement.create>[0]['data']
          }); 
          break;
        case 'adminPermission': 
          await db.adminPermission.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.adminPermission.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.adminPermission.create>[0]['data']
          }); 
          break;
        case 'adminSession': 
          await db.adminSession.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.adminSession.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.adminSession.create>[0]['data']
          }); 
          break;
        case 'passwordResetToken': 
          await db.passwordResetToken.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.passwordResetToken.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.passwordResetToken.create>[0]['data']
          }); 
          break;
        case 'clubDistance': 
          await db.clubDistance.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.clubDistance.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.clubDistance.create>[0]['data']
          }); 
          break;
        case 'userClub': 
          await db.userClub.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.userClub.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.userClub.create>[0]['data']
          }); 
          break;
        case 'favorite': 
          await db.favorite.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.favorite.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.favorite.create>[0]['data']
          }); 
          break;
        case 'userGroup': 
          await db.userGroup.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.userGroup.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.userGroup.create>[0]['data']
          }); 
          break;
        case 'userAchievement': 
          await db.userAchievement.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.userAchievement.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.userAchievement.create>[0]['data']
          }); 
          break;
        case 'courseHole': 
          await db.courseHole.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.courseHole.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.courseHole.create>[0]['data']
          }); 
          break;
        case 'courseTee': 
          await db.courseTee.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.courseTee.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.courseTee.create>[0]['data']
          }); 
          break;
        case 'tournament': 
          await db.tournament.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.tournament.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.tournament.create>[0]['data']
          }); 
          break;
        case 'courseHoleDistance': 
          await db.courseHoleDistance.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.courseHoleDistance.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.courseHoleDistance.create>[0]['data']
          }); 
          break;
        case 'round': 
          await db.round.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.round.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.round.create>[0]['data']
          }); 
          break;
        case 'roundScore': 
          await db.roundScore.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.roundScore.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.roundScore.create>[0]['data']
          }); 
          break;
        case 'message': 
          await db.message.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.message.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.message.create>[0]['data']
          }); 
          break;
        case 'messageRead': 
          await db.messageRead.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.messageRead.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.messageRead.create>[0]['data']
          }); 
          break;
        case 'tournamentParticipant': 
          await db.tournamentParticipant.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.tournamentParticipant.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.tournamentParticipant.create>[0]['data']
          }); 
          break;
        case 'golfPartnerRequest': 
          await db.golfPartnerRequest.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.golfPartnerRequest.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.golfPartnerRequest.create>[0]['data']
          }); 
          break;
        case 'golfPartnerRequestParticipant': 
          await db.golfPartnerRequestParticipant.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.golfPartnerRequestParticipant.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.golfPartnerRequestParticipant.create>[0]['data']
          }); 
          break;
        default:
          errors.push(`${tableName}[${record.id || '?'}]: Unknown model`);
          continue;
      }
      count++;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      errors.push(`${tableName}[${record.id || '?'}]: ${errorMsg}`);
      console.error(`Error inserting ${tableName}[${record.id}]:`, errorMsg);
    }
  }
  
  return { count, errors, filteredFields };
}

// POST /api/admin/restore - Restore database from JSON backup
export async function POST(request: NextRequest) {
  try {
    console.log('Restore: Starting restore process...');
    
    // Verify admin session from cookie
    const token = request.cookies.get('session_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can restore
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Super Admin access required for restore operations' },
        { status: 403 }
      );
    }

    // Parse the backup JSON
    const backup = await request.json();
    
    // Validate backup structure
    if (!backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup file format - missing data section' },
        { status: 400 }
      );
    }

    const data = backup.data;
    
    console.log('Restore - Backup version:', backup.version);
    console.log('Restore - Data keys:', Object.keys(data));
    console.log('Restore - Statistics:', backup.statistics);
    
    // Use provided table order or calculate from dependencies
    const tableOrder = backup.tableOrder || getTableRestoreOrder();
    
    console.log('Restore - Using table order:', tableOrder);

    const results = {
      cleared: [] as string[],
      imported: [] as { table: string; count: number }[],
      errors: [] as string[],
      skipped: [] as string[],
      filteredFields: [] as string[],
    };

    // Step 1: Clear all tables (outside transaction to avoid timeout)
    console.log('Restore: Clearing all tables...');
    const clearResult = await clearAllTables();
    results.cleared = clearResult.cleared;
    results.errors.push(...clearResult.errors);
    console.log('Restore: Cleared tables:', results.cleared);

    // Step 2: Import data in dependency order (parents first) - without transaction
    for (const tableName of tableOrder) {
      const tableData = data[tableName];
      
      console.log(`Restore - Processing table ${tableName}:`, {
        exists: !!tableData,
        isArray: Array.isArray(tableData),
        length: Array.isArray(tableData) ? tableData.length : 'N/A'
      });
      
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        results.skipped.push(tableName);
        continue;
      }
      
      const { count, errors, filteredFields } = await insertRecords(tableName, tableData);
      
      if (count > 0) {
        results.imported.push({ table: tableName, count });
      }
      results.errors.push(...errors);
      results.filteredFields.push(...filteredFields);
      
      console.log(`Restore - Imported ${count} records into ${tableName}`);
    }

    // Calculate summary
    const totalImported = results.imported.reduce((sum, t) => sum + t.count, 0);
    
    console.log('Restore: Complete. Total records imported:', totalImported);
    
    return NextResponse.json({
      success: true,
      message: `Database restored successfully! ${totalImported} records imported across ${results.imported.length} tables.`,
      results: {
        tablesCleared: results.cleared.length,
        tablesImported: results.imported.length,
        totalRecords: totalImported,
        errors: results.errors.length,
        errorDetails: results.errors.slice(0, 20),
        filteredFields: [...new Set(results.filteredFields)],
      },
      details: results.imported,
    });
    
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Failed to restore database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
