import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/super-admin';

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

// Course tables in restore order (parents first, then children)
const COURSE_TABLES_ORDER = ['golf_courses', 'course_holes', 'course_tees', 'course_hole_distances'];

// Course tables in clear order (children first, then parents)
const COURSE_TABLES_CLEAR_ORDER = ['course_hole_distances', 'course_tees', 'course_holes', 'golf_courses'];

// Map table names to Prisma model names
const TABLE_TO_MODEL: Record<string, string> = {
  golf_courses: 'golfCourse',
  course_holes: 'courseHole',
  course_tees: 'courseTee',
  course_hole_distances: 'courseHoleDistance',
};

// Clear all course-related tables
async function clearCourseTables(): Promise<{ cleared: string[]; errors: string[] }> {
  const cleared: string[] = [];
  const errors: string[] = [];
  
  // Clear in reverse dependency order (children first)
  for (const tableName of COURSE_TABLES_CLEAR_ORDER) {
    try {
      switch (tableName) {
        case 'golf_courses': 
          await db.golfCourse.deleteMany(); 
          break;
        case 'course_holes': 
          await db.courseHole.deleteMany(); 
          break;
        case 'course_tees': 
          await db.courseTee.deleteMany(); 
          break;
        case 'course_hole_distances': 
          await db.courseHoleDistance.deleteMany(); 
          break;
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
      
      const id = filteredRecord.id as string;
      
      switch (model) {
        case 'golfCourse': 
          await db.golfCourse.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.golfCourse.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.golfCourse.create>[0]['data']
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
        case 'courseHoleDistance': 
          await db.courseHoleDistance.upsert({ 
            where: { id },
            update: filteredRecord as Parameters<typeof db.courseHoleDistance.update>[0]['data'],
            create: filteredRecord as Parameters<typeof db.courseHoleDistance.create>[0]['data']
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

// POST /api/admin/courses/restore - Restore golf courses from JSON backup
export async function POST(request: NextRequest) {
  try {
    console.log('Courses Restore: Starting restore process...');
    
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

    // Only super admins can restore courses
    if (!isSuperAdminEmail(session.user.email)) {
      console.log('Courses Restore: Not super admin:', session.user.email);
      return NextResponse.json(
        { error: 'Super Admin access required for restore operations' },
        { status: 403 }
      );
    }

    console.log('Courses Restore: Authorized user:', session.user.email);

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
    
    console.log('Courses Restore - Backup version:', backup.version);
    console.log('Courses Restore - Data keys:', Object.keys(data));
    console.log('Courses Restore - Statistics:', backup.statistics);
    
    const results = {
      cleared: [] as string[],
      imported: [] as { table: string; count: number }[],
      errors: [] as string[],
      skipped: [] as string[],
      filteredFields: [] as string[],
    };

    // Step 1: Clear all course tables (outside transaction)
    console.log('Courses Restore: Clearing course tables...');
    const clearResult = await clearCourseTables();
    results.cleared = clearResult.cleared;
    results.errors.push(...clearResult.errors);
    console.log('Courses Restore: Cleared tables:', results.cleared);

    // Step 2: Import data in dependency order (parents first)
    for (const tableName of COURSE_TABLES_ORDER) {
      const tableData = data[tableName];
      
      console.log(`Courses Restore - Processing table ${tableName}:`, {
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
      
      console.log(`Courses Restore - Imported ${count} records into ${tableName}`);
    }

    // Calculate summary
    const totalImported = results.imported.reduce((sum, t) => sum + t.count, 0);
    
    console.log('Courses Restore: Complete. Total records imported:', totalImported);
    
    return NextResponse.json({
      success: true,
      message: `Golf courses restored successfully! ${totalImported} records imported across ${results.imported.length} tables.`,
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
    console.error('Courses Restore error:', error);
    return NextResponse.json(
      { error: 'Failed to restore golf courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
