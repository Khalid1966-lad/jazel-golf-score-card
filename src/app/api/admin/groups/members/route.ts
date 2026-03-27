import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Add a user to a group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, userId } = body;

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and User ID are required' }, { status: 400 });
    }

    // Check if group exists
    const group = await db.golferGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already in the group
    const existingMembership = await db.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 });
    }

    // Add user to group
    const membership = await db.userGroup.create({
      data: {
        userId,
        groupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            handicap: true,
            city: true,
            country: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error('Error adding user to group:', error);
    return NextResponse.json({ error: 'Failed to add user to group' }, { status: 500 });
  }
}

// DELETE - Remove a user from a group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Group ID and User ID are required' }, { status: 400 });
    }

    // Check if membership exists
    const membership = await db.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this group' }, { status: 404 });
    }

    // Remove user from group
    await db.userGroup.delete({
      where: {
        userId_groupId: {
          userId,
          groupId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing user from group:', error);
    return NextResponse.json({ error: 'Failed to remove user from group' }, { status: 500 });
  }
}

// PUT - Bulk add/remove users from a group
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, userIds } = body;

    if (!groupId || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Group ID and array of User IDs are required' }, { status: 400 });
    }

    // Check if group exists
    const group = await db.golferGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get existing memberships
    const existingMemberships = await db.userGroup.findMany({
      where: { groupId },
      select: { userId: true }
    });

    const existingUserIds = existingMemberships.map(m => m.userId);
    const userIdsSet = new Set(userIds);

    // Users to add (in new list but not in existing)
    const usersToAdd = userIds.filter(id => !existingUserIds.includes(id));

    // Users to remove (in existing but not in new list)
    const usersToRemove = existingUserIds.filter(id => !userIdsSet.has(id));

    // Add new members
    if (usersToAdd.length > 0) {
      await db.userGroup.createMany({
        data: usersToAdd.map(userId => ({
          userId,
          groupId
        })),
        skipDuplicates: true
      });
    }

    // Remove old members
    if (usersToRemove.length > 0) {
      await db.userGroup.deleteMany({
        where: {
          groupId,
          userId: { in: usersToRemove }
        }
      });
    }

    // Return updated group with members
    const updatedGroup = await db.golferGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                handicap: true,
                city: true,
                country: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      group: updatedGroup,
      added: usersToAdd.length,
      removed: usersToRemove.length
    });
  } catch (error) {
    console.error('Error updating group members:', error);
    return NextResponse.json({ error: 'Failed to update group members' }, { status: 500 });
  }
}
