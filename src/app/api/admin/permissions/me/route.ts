import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { cookies } from 'next/headers';

// GET - Get current admin's permissions
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    console.log('[Permissions ME] Token found:', !!token);

    if (!token) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        debug: 'No session_token cookie' 
      }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, isSuperAdmin: true, isAdmin: true, blocked: true }
        }
      }
    });

    console.log('[Permissions ME] Session found:', !!session);
    console.log('[Permissions ME] Session user:', session?.user?.email);
    console.log('[Permissions ME] Session expired:', session ? session.expiresAt < new Date() : 'N/A');

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ 
        error: 'Session expired', 
        debug: 'Session not found or expired' 
      }, { status: 401 });
    }

    // Check if user is blocked or not an admin
    if (session.user.blocked || !session.user.isAdmin) {
      console.log('[Permissions ME] User blocked or not admin:', { 
        blocked: session.user.blocked, 
        isAdmin: session.user.isAdmin 
      });
      return NextResponse.json({ 
        error: 'Unauthorized', 
        debug: 'User blocked or not admin' 
      }, { status: 403 });
    }

    // Check if super admin (has full access)
    const isSuperAdmin = session.user.isSuperAdmin || isSuperAdminEmail(session.user.email);
    console.log('[Permissions ME] Is super admin:', isSuperAdmin, { 
      dbField: session.user.isSuperAdmin, 
      emailCheck: isSuperAdminEmail(session.user.email) 
    });

    if (isSuperAdmin) {
      // Super admins have all permissions
      console.log('[Permissions ME] Returning super admin permissions');
      return NextResponse.json({
        isSuperAdmin: true,
        permissions: {
          canViewCourses: true,
          canViewUsers: true,
          canViewTournaments: true,
          canViewGroups: true,
          canViewMessages: true,
          canViewSettings: true,
          canViewBackup: true,
        }
      });
    }

    // Get regular admin permissions
    console.log('[Permissions ME] Fetching regular admin permissions for user:', session.user.id);
    const permissions = await db.adminPermission.findUnique({
      where: { userId: session.user.id }
    });

    console.log('[Permissions ME] Permissions found:', !!permissions);

    // If no permissions set, return defaults
    if (!permissions) {
      return NextResponse.json({
        isSuperAdmin: false,
        permissions: {
          canViewCourses: true,
          canViewUsers: true,
          canViewTournaments: true,
          canViewGroups: true,
          canViewMessages: true,
          canViewSettings: true,
          canViewBackup: false,
        }
      });
    }

    return NextResponse.json({
      isSuperAdmin: false,
      permissions: {
        canViewCourses: permissions.canViewCourses ?? true,
        canViewUsers: permissions.canViewUsers ?? true,
        canViewTournaments: permissions.canViewTournaments ?? true,
        canViewGroups: permissions.canViewGroups ?? true,
        canViewMessages: permissions.canViewMessages ?? true,
        canViewSettings: permissions.canViewSettings ?? true,
        canViewBackup: permissions.canViewBackup ?? false,
      }
    });
  } catch (error) {
    console.error('[Permissions ME] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch permissions', 
      debug: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
