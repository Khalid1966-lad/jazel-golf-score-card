import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// Check if current user is an admin (no password needed)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Find the regular user session
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { 
        user: {
          select: { id: true, email: true, name: true, isAdmin: true, blocked: true }
        }
      }
    });

    // Check if session is valid, not expired, user is admin and not blocked
    if (!session || 
        session.expiresAt < new Date() || 
        !session.user.isAdmin || 
        session.user.blocked) {
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: session.user 
    });
  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// No longer needed - admin access is based on user.isAdmin status
// Keeping POST for compatibility but it just checks session
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Find the regular user session
    const session = await db.adminSession.findUnique({
      where: { token },
      include: { 
        user: {
          select: { id: true, email: true, name: true, isAdmin: true, blocked: true }
        }
      }
    });

    // Check if session is valid
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.adminSession.delete({ where: { token } });
      }
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Check if user is blocked
    if (session.user.blocked) {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    // Check if user is admin
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      user: session.user 
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Logout from admin (clears admin_token if exists, but keeps session_token)
export async function DELETE(request: NextRequest) {
  try {
    // We don't delete the session_token here - just the admin_token
    // The user stays logged in, just exits admin panel
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    if (adminToken) {
      await db.adminSession.deleteMany({ where: { token: adminToken } });
      cookieStore.delete('admin_token');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
