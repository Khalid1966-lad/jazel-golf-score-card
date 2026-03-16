import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/messages - Get all messages for admin
export async function GET(request: NextRequest) {
  try {
    const messages = await db.message.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format messages with read count
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      title: msg.title,
      content: msg.content,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      author: msg.author,
      readCount: msg.reads.length,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
