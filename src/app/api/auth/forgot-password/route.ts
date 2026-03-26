import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

// Request password reset
export async function POST(request: NextRequest) {
  console.log('📧 Password reset request received');
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('📧 Looking for user:', email.toLowerCase());

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists or not (security best practice)
    const genericMessage = 'If the email exists in our system, a reset link will be sent';

    if (!user) {
      console.log('📧 User not found (but not revealing this to user)');
      // Still return success to not reveal if email exists
      return NextResponse.json({ success: true, message: genericMessage });
    }

    console.log('📧 User found:', user.email);

    // Check if user is blocked
    if (user.blocked) {
      console.log('📧 User is blocked (but not revealing this to user)');
      // Don't reveal that account is blocked
      return NextResponse.json({ success: true, message: genericMessage });
    }

    // Delete any existing reset tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('📧 Reset token created:', token.substring(0, 10) + '...');

    // Construct reset URL - use request headers to get actual host
    const host = request.headers.get('host') || 'jazel-golf-score-card.vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    console.log('📧 App URL:', appUrl);
    console.log('📧 Reset URL:', resetUrl);
    console.log('📧 BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);
    console.log('📧 EMAIL_FROM:', process.env.EMAIL_FROM || 'not set');

    // Send the password reset email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: user.name || undefined,
    });

    console.log('📧 Email result:', emailResult);

    if (!emailResult.success) {
      console.error('❌ Failed to send password reset email:', emailResult.error);
      console.log('🔑 Reset token (for admin debugging):', token);
      
      // Don't reveal error details to user - just say email sent
      return NextResponse.json({ 
        success: true, 
        message: genericMessage,
      });
    }

    console.log(`✅ Password reset email sent to ${user.email}`);

    return NextResponse.json({ 
      success: true, 
      message: genericMessage,
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
