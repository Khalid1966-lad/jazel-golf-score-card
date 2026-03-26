import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { cookies } from 'next/headers';

// Helper to verify admin authentication
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    return null;
  }

  const session = await db.adminSession.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, email: true, isSuperAdmin: true, isAdmin: true, blocked: true }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.adminSession.delete({ where: { token } });
    }
    return null;
  }

  // Check if user is blocked or not an admin
  if (session.user.blocked || !session.user.isAdmin) {
    return null;
  }

  // Check if user is super admin via database field OR email list
  const isSuperAdmin = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);

  if (!isSuperAdmin) {
    return null;
  }

  return session.user;
}

// POST - Add default tees to all courses without tees
export async function POST() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
  }
  
  try {
    // Get all courses without tees
    const courses = await db.golfCourse.findMany({
      include: { tees: true }
    });
    
    const results = {
      total: courses.length,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    for (const course of courses) {
      if (course.tees.length === 0) {
        try {
          await db.courseTee.createMany({
            data: [
              { courseId: course.id, name: 'Championship', color: '#000000' },
              { courseId: course.id, name: 'Mens', color: '#ffffff' },
              { courseId: course.id, name: 'Womens', color: '#ff0000' }
            ]
          });
          results.updated++;
        } catch (e) {
          results.errors.push(`${course.name}: ${e}`);
        }
      } else {
        results.skipped++;
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error adding default tees:', error);
    return NextResponse.json({ error: 'Failed to add default tees' }, { status: 500 });
  }
}
