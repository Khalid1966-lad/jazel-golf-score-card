import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all groups or a single group with members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');
    const includeMembers = searchParams.get('includeMembers') === 'true';

    if (groupId) {
      // Fetch single group with members
      const group = await db.golferGroup.findUnique({
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

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        group: {
          ...group,
          members: group.members.map(m => ({
            ...m,
            user: {
              ...m.user,
              name: m.user.name || 'Unknown'
            }
          }))
        } 
      });
    }

    // Fetch all groups
    const groups = await db.golferGroup.findMany({
      include: includeMembers ? {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handicap: true,
              }
            }
          }
        }
      } : {
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Check if group with same name exists
    const existingGroup = await db.golferGroup.findFirst({
      where: { name: name.trim() }
    });

    if (existingGroup) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
    }

    const group = await db.golferGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      }
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PUT - Update a group
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Check if group exists
    const existingGroup = await db.golferGroup.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingGroup.name) {
      const duplicateName = await db.golferGroup.findFirst({
        where: { 
          name: name.trim(),
          id: { not: groupId }
        }
      });

      if (duplicateName) {
        return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 });
      }
    }

    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const group = await db.golferGroup.update({
      where: { id: groupId },
      data: updateData
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE - Delete a group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if group exists
    const existingGroup = await db.golferGroup.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Delete all group memberships first (cascade should handle this, but let's be explicit)
    await db.userGroup.deleteMany({
      where: { groupId }
    });

    // Delete the group
    await db.golferGroup.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
