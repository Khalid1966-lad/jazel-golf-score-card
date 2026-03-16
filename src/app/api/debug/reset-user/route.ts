import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

// Debug endpoint to reset a user's password
export async function POST(request: NextRequest) {
  // Simple auth check - only allow with secret
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.DEBUG_SECRET && secret !== 'jazel-debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      success: true,
      message: `Password updated for ${email}`,
      userId: user.id
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
