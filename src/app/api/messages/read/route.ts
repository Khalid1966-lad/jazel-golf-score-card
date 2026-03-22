import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/messages/read - Mark a message as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId } = body;

    if (!messageId || !userId) {
      return NextResponse.json({ error: 'Message ID and User ID are required' }, { status: 400 });
    }

    // Check if already marked as read
    const existingRead = await db.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existingRead) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Mark as read
    await db.messageRead.create({
      data: {
        messageId,
        userId,
      },
    });

    return NextResponse.json({ success: true, alreadyRead: false });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}

// POST /api/messages/read - Mark all messages as read for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all messages
    const messages = await db.message.findMany({
      select: { id: true },
    });

    // Mark all as read
    const readPromises = messages.map((msg) =>
      db.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId: msg.id,
            userId,
          },
        },
        update: {},
        create: {
          messageId: msg.id,
          userId,
        },
      })
    );

    await Promise.all(readPromises);

    return NextResponse.json({ success: true, count: messages.length });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark all messages as read' }, { status: 500 });
  }
}
