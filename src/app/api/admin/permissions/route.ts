import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { cookies } from 'next/headers';

// GET - Get all admin users with their permissions (super admin only)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    console.log('[Permissions API] Token found:', !!token);

    if (!token) {
      console.log('[Permissions API] No token found');
      return NextResponse.json({ error: 'Not authenticated', debug: 'No session_token cookie' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, isSuperAdmin: true, isAdmin: true, blocked: true }
        }
      }
    });

    console.log('[Permissions API] Session found:', !!session);
    console.log('[Permissions API] Session user:', session?.user?.email);

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ error: 'Session expired', debug: 'Session not found or expired' }, { status: 401 });
    }

    // Check if user is blocked or not an admin
    if (session.user.blocked || !session.user.isAdmin) {
      console.log('[Permissions API] User blocked or not admin:', { blocked: session.user.blocked, isAdmin: session.user.isAdmin });
      return NextResponse.json({ error: 'Unauthorized', debug: 'User blocked or not admin' }, { status: 403 });
    }

    // Check if user is super admin via database field OR email list
    const isSuperAdmin = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);
    console.log('[Permissions API] Is super admin:', isSuperAdmin, { dbField: session.user.isSuperAdmin, emailCheck: isSuperAdminEmail(session.user.email) });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required', debug: 'Not a super admin' }, { status: 403 });
    }

    // Get all admin users (excluding super admins)
    // Using a simpler query to avoid OR/null issues across databases
    const allAdmins = await db.user.findMany({
      where: {
        isAdmin: true,
        email: {
          notIn: ['kbelkhalfi@gmail.com', 'contact@jazelwebagency.com']
        }
      },
      include: {
        adminPermission: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out super admins in JavaScript to avoid database compatibility issues
    // Also transform the data to ensure adminPermission is never null
    const admins = allAdmins
      .filter(admin => !admin.isSuperAdmin)
      .map(admin => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        adminPermission: admin.adminPermission ? {
          canViewCourses: admin.adminPermission.canViewCourses ?? true,
          canViewUsers: admin.adminPermission.canViewUsers ?? true,
          canViewTournaments: admin.adminPermission.canViewTournaments ?? true,
          canViewGroups: admin.adminPermission.canViewGroups ?? true,
          canViewMessages: admin.adminPermission.canViewMessages ?? true,
          canViewSettings: admin.adminPermission.canViewSettings ?? true,
          canViewBackup: admin.adminPermission.canViewBackup ?? false,
        } : null
      }));

    console.log('[Permissions API] Found admins:', admins.length);
    console.log('[Permissions API] Admin details:', admins.map(a => ({ id: a.id, email: a.email, hasPermissions: !!a.adminPermission })));

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('[Permissions API] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch permissions', 
      debug: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST - Create or update permissions for an admin (super admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    console.log('[Permissions POST] Token found:', !!token);

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated', debug: 'No session_token cookie' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, isSuperAdmin: true, isAdmin: true, blocked: true }
        }
      }
    });

    console.log('[Permissions POST] Session found:', !!session, 'User:', session?.user?.email);

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired', debug: 'Session not found or expired' }, { status: 401 });
    }

    // Check if user is blocked or not an admin
    if (session.user.blocked || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized', debug: 'User blocked or not admin' }, { status: 403 });
    }

    // Check if user is super admin via database field OR email list
    const isSuperAdmin = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required', debug: 'Not a super admin' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, permissions } = body;

    console.log('[Permissions POST] Updating user:', userId, 'with permissions:', permissions);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the user exists and is not a super admin
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser || isSuperAdminEmail(targetUser.email) || targetUser.isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot modify super admin permissions' }, { status: 400 });
    }

    // Upsert permissions
    const permission = await db.adminPermission.upsert({
      where: { userId },
      update: {
        canViewCourses: permissions.canViewCourses ?? true,
        canViewUsers: permissions.canViewUsers ?? true,
        canViewTournaments: permissions.canViewTournaments ?? true,
        canViewGroups: permissions.canViewGroups ?? true,
        canViewMessages: permissions.canViewMessages ?? true,
        canViewSettings: permissions.canViewSettings ?? true,
        canViewBackup: permissions.canViewBackup ?? false,
      },
      create: {
        userId,
        canViewCourses: permissions.canViewCourses ?? true,
        canViewUsers: permissions.canViewUsers ?? true,
        canViewTournaments: permissions.canViewTournaments ?? true,
        canViewGroups: permissions.canViewGroups ?? true,
        canViewMessages: permissions.canViewMessages ?? true,
        canViewSettings: permissions.canViewSettings ?? true,
        canViewBackup: permissions.canViewBackup ?? false,
      }
    });

    console.log('[Permissions POST] Updated permission for user:', userId);

    return NextResponse.json({ success: true, permission });
  } catch (error) {
    console.error('[Permissions POST] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update permissions', 
      debug: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
