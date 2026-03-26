import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/super-admin';

// GET /api/admin/courses/backup - Export golf courses data as JSON
export async function GET(request: NextRequest) {
  try {
    console.log('Courses Backup: Starting backup process...');
    
    // Verify admin session from cookie
    const token = request.cookies.get('session_token')?.value;
    
    if (!token) {
      console.log('Courses Backup: No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      console.log('Courses Backup: Invalid session or not admin');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can backup courses
    if (!isSuperAdminEmail(session.user.email)) {
      console.log('Courses Backup: Not super admin:', session.user.email);
      return NextResponse.json(
        { error: 'Super Admin access required for backup operations' },
        { status: 403 }
      );
    }

    console.log('Courses Backup: Authorized user:', session.user.email);

    // Fetch golf courses related data only
    const data: Record<string, unknown[]> = {};
    const statistics: Record<string, number> = {};
    const errors: string[] = [];

    // Fetch golf courses
    try {
      data.golf_courses = await db.golfCourse.findMany();
      statistics.golf_courses = data.golf_courses.length;
    } catch (e) {
      errors.push(`golf_courses: ${e instanceof Error ? e.message : 'Unknown error'}`);
      data.golf_courses = [];
      statistics.golf_courses = 0;
    }

    // Fetch course holes
    try {
      data.course_holes = await db.courseHole.findMany();
      statistics.course_holes = data.course_holes.length;
    } catch (e) {
      errors.push(`course_holes: ${e instanceof Error ? e.message : 'Unknown error'}`);
      data.course_holes = [];
      statistics.course_holes = 0;
    }

    // Fetch course tees
    try {
      data.course_tees = await db.courseTee.findMany();
      statistics.course_tees = data.course_tees.length;
    } catch (e) {
      errors.push(`course_tees: ${e instanceof Error ? e.message : 'Unknown error'}`);
      data.course_tees = [];
      statistics.course_tees = 0;
    }

    // Fetch course hole distances
    try {
      data.course_hole_distances = await db.courseHoleDistance.findMany();
      statistics.course_hole_distances = data.course_hole_distances.length;
    } catch (e) {
      errors.push(`course_hole_distances: ${e instanceof Error ? e.message : 'Unknown error'}`);
      data.course_hole_distances = [];
      statistics.course_hole_distances = 0;
    }

    console.log('Courses Backup: Statistics:', statistics);
    if (errors.length > 0) {
      console.log('Courses Backup: Errors encountered:', errors);
    }

    // Build backup object with metadata
    const backup = {
      version: '1.0',
      type: 'courses',
      exportDate: new Date().toISOString(),
      exportedBy: session.user.name || session.user.email,
      statistics,
      tableOrder: ['golf_courses', 'course_holes', 'course_tees', 'course_hole_distances'],
      data,
    };

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(backup, null, 2);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `jazel-courses-backup-${dateStr}_${timeStr}.json`;
    
    console.log('Courses Backup: Complete. Total records:', Object.values(statistics).reduce((a, b) => a + b, 0));
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Courses Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create courses backup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
