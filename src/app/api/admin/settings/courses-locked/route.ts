import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/super-admin';

const SETTING_KEY = 'courses_locked';

// GET - Check if courses are locked
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await db.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    const locked = setting?.value === 'true';

    return NextResponse.json({ locked });
  } catch (error) {
    console.error('Error checking courses lock:', error);
    return NextResponse.json({ locked: false });
  }
}

// POST - Toggle courses lock (super admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { locked } = body;

    if (typeof locked !== 'boolean') {
      return NextResponse.json(
        { error: 'locked must be a boolean' },
        { status: 400 }
      );
    }

    await db.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: String(locked) },
      create: { key: SETTING_KEY, value: String(locked) },
    });

    return NextResponse.json({ success: true, locked });
  } catch (error) {
    console.error('Error toggling courses lock:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
