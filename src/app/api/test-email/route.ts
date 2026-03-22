import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Test email endpoint called');
  
  const apiKey = process.env.BREVO_API_KEY;
  console.log('🧪 BREVO_API_KEY exists:', !!apiKey);
  console.log('🧪 BREVO_API_KEY length:', apiKey?.length);
  console.log('🧪 BREVO_API_KEY starts with xkeysib:', apiKey?.startsWith('xkeysib-'));
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'BREVO_API_KEY not set',
      env: Object.keys(process.env).filter(k => k.includes('BREVO') || k.includes('EMAIL'))
    });
  }
  
  try {
    // Dynamic import to avoid build failures
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BrevoClient } = require('@getbrevo/brevo');
    const brevo = new BrevoClient({ apiKey });
    
    // Use the verified sender email from Brevo
    const senderEmail = 'contact@jazelwebagency.com';
    
    console.log('🧪 Sending test email...');
    
    // Test sending an email to yourself
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'Jazel Golf Test',
        email: senderEmail,
      },
      to: [{
        email: 'contact@jazelwebagency.com', // Send to the verified sender
      }],
      subject: 'Test Email from Jazel Golf',
      htmlContent: '<h1>✅ Test Email from Jazel Golf</h1><p>If you receive this, Brevo is working correctly!</p><p>Sent at: ' + new Date().toISOString() + '</p>',
    });
    
    console.log('🧪 Brevo response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json({ 
      success: true,
      apiKeyPrefix: apiKey.substring(0, 25) + '...',
      senderEmail: senderEmail,
      response: response.data
    });
  } catch (error: unknown) {
    console.error('🧪 Brevo error:', error);
    const err = error as { message?: string; body?: unknown; statusCode?: number };
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      statusCode: err.statusCode,
      details: err.body || 'No additional details',
      apiKeyPrefix: apiKey?.substring(0, 25) + '...',
    }, { status: 500 });
  }
}
