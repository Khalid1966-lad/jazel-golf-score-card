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

    // Get all groups and users for target name resolution
    const groups = await db.golferGroup.findMany({
      select: { id: true, name: true }
    });
    
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true }
    });

    // Create lookup maps
    const groupMap = new Map(groups.map(g => [g.id, g.name]));
    const userMap = new Map(users.map(u => [u.id, u.name || u.email]));

    // Format messages with read count and target info
    const formattedMessages = messages.map((msg) => {
      let targetName: string | null = null;
      
      if (msg.targetType === 'group' && msg.targetId) {
        targetName = groupMap.get(msg.targetId) || null;
      } else if (msg.targetType === 'user' && msg.targetId) {
        targetName = userMap.get(msg.targetId) || null;
      }

      return {
        id: msg.id,
        title: msg.title,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        author: msg.author,
        targetType: msg.targetType,
        targetId: msg.targetId,
        targetName,
        readCount: msg.reads.length,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
