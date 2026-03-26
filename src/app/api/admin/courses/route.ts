import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Super Admin emails - same as frontend
const SUPER_ADMIN_EMAILS = [
  'kbelkhalfi@gmail.com',
  'contact@jazelwebagency.com',
];

const isSuperAdminEmail = (email: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

// Helper to verify admin authentication
async function verifyAdmin(request: NextRequest) {
  // Check for admin access via session_token (same as other admin APIs)
  const sessionToken = request.cookies.get('session_token')?.value;
  
  if (!sessionToken) {
    console.log('[ADMIN COURSES] No session_token cookie');
    return null;
  }
  
  const session = await db.adminSession.findUnique({
    where: { token: sessionToken },
    include: { 
      user: {
        select: { id: true, email: true, isAdmin: true, isSuperAdmin: true }
      }
    }
  });
  
  if (!session) {
    console.log('[ADMIN COURSES] No session found');
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    console.log('[ADMIN COURSES] Session expired');
    await db.adminSession.delete({ where: { token: sessionToken } });
    return null;
  }
  
  if (!session.user.isAdmin) {
    console.log('[ADMIN COURSES] User not admin');
    return null;
  }
  
  // Check super admin - either by database field OR by email list
  const isSuper = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);
  console.log('[ADMIN COURSES] Verified:', session.user.email, 'isSuperAdmin:', isSuper, '(db:', session.user.isSuperAdmin, ', email:', isSuperAdminEmail(session.user.email), ')');
  
  return { ...session.user, isSuperAdmin: isSuper };
}

// GET - List all courses with holes
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Super admins can see all courses, regular admins only see courses assigned to them
    const whereClause = admin.isSuperAdmin 
      ? {} 
      : { adminId: admin.id };

    const courses = await db.golfCourse.findMany({
      where: whereClause,
      include: {
        holes: {
          orderBy: { holeNumber: 'asc' }
        },
        tees: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST - Create new course
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, city, region, country, latitude, longitude, totalHoles, description, designer, yearBuilt, phone, website, address, holes, adminId: requestedAdminId } = body;

    // Determine the admin assignment:
    // - Regular admins: automatically assigned to the course they create
    // - Super admins: can specify any admin or leave unassigned
    let assignedAdminId: string | null = null;
    if (admin.isSuperAdmin) {
      // Super admin can specify any admin or leave it unassigned
      assignedAdminId = requestedAdminId || null;
    } else {
      // Regular admin is automatically assigned to the course they create
      assignedAdminId = admin.id;
    }

    const course = await db.golfCourse.create({
      data: {
        name,
        city,
        region,
        country: country || 'Morocco',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        totalHoles: parseInt(totalHoles) || 18,
        description,
        designer,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
        phone,
        website,
        address,
        adminId: assignedAdminId,
        holes: {
          create: holes || []
        },
        // Create default tee types
        tees: {
          create: [
            { name: 'Championship', color: '#000000' },
            { name: 'Mens', color: '#ffffff' },
            { name: 'Womens', color: '#ff0000' }
          ]
        }
      },
      include: {
        holes: true,
        tees: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
