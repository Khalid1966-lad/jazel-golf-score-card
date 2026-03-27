import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/messages - Get all messages for a user (with read status)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const adminId = searchParams.get('adminId');

    // If adminId is provided, return all messages for admin panel
    if (adminId && !userId) {
      const admin = await db.user.findUnique({
        where: { id: adminId },
        select: { isAdmin: true },
      });

      if (!admin?.isAdmin) {
        return NextResponse.json({ error: 'Only admins can view all messages' }, { status: 403 });
      }

      const messages = await db.message.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { reads: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      // Format messages with target info for admin
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        title: msg.title,
        content: msg.content,
        createdAt: msg.createdAt,
        author: msg.author,
        targetType: msg.targetType,
        targetId: msg.targetId,
        _count: msg._count,
      }));

      return NextResponse.json({ messages: formattedMessages });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's groups
    const userGroups = await db.userGroup.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const userGroupIds = userGroups.map(ug => ug.groupId);

    // Get all messages with author info and read status
    // A user sees messages where:
    // 1. targetType is 'all'
    // 2. targetType is 'user' and targetId matches userId
    // 3. targetType is 'group' and targetId is in user's groups
    const messages = await db.message.findMany({
      where: {
        OR: [
          { targetType: 'all' },
          { targetType: 'user', targetId: userId },
          { targetType: 'group', targetId: { in: userGroupIds } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reads: {
          where: { userId },
          select: { id: true, readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format messages with read status
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      title: msg.title,
      content: msg.content,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      author: msg.author,
      targetType: msg.targetType,
      targetId: msg.targetId,
      isRead: msg.reads.length > 0,
      readAt: msg.reads[0]?.readAt || null,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages - Create a new message (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, title, content, targetType, targetId } = body;

    if (!authorId || !title || !content) {
      return NextResponse.json({ error: 'Author ID, title, and content are required' }, { status: 400 });
    }

    // Verify the author is an admin
    const author = await db.user.findUnique({
      where: { id: authorId },
      select: { isAdmin: true },
    });

    if (!author?.isAdmin) {
      return NextResponse.json({ error: 'Only admins can create messages' }, { status: 403 });
    }

    // Validate target
    if (targetType === 'group' && !targetId) {
      return NextResponse.json({ error: 'Group ID is required for group messages' }, { status: 400 });
    }

    if (targetType === 'user' && !targetId) {
      return NextResponse.json({ error: 'User ID is required for individual messages' }, { status: 400 });
    }

    // Verify target exists if specified
    if (targetType === 'group' && targetId) {
      const group = await db.golferGroup.findUnique({
        where: { id: targetId }
      });
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
    }

    if (targetType === 'user' && targetId) {
      const user = await db.user.findUnique({
        where: { id: targetId }
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    const message = await db.message.create({
      data: {
        authorId,
        title,
        content,
        targetType: targetType || 'all',
        targetId: targetId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

// PUT /api/messages - Update a message (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, title, content, adminId } = body;

    if (!messageId || !adminId) {
      return NextResponse.json({ error: 'Message ID and admin ID are required' }, { status: 400 });
    }

    // Verify the user is an admin
    const admin = await db.user.findUnique({
      where: { id: adminId },
      select: { isAdmin: true },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'Only admins can update messages' }, { status: 403 });
    }

    const updateData: { title?: string; content?: string } = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const message = await db.message.update({
      where: { id: messageId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE /api/messages - Delete a message (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const adminId = searchParams.get('adminId');

    if (!messageId || !adminId) {
      return NextResponse.json({ error: 'Message ID and admin ID are required' }, { status: 400 });
    }

    // Verify the user is an admin
    const admin = await db.user.findUnique({
      where: { id: adminId },
      select: { isAdmin: true },
    });

    if (!admin?.isAdmin) {
      return NextResponse.json({ error: 'Only admins can delete messages' }, { status: 403 });
    }

    // Delete associated read records first
    await db.messageRead.deleteMany({
      where: { messageId },
    });

    // Delete the message
    await db.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
