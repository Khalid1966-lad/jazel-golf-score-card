import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all partner requests or filter by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const createdBy = searchParams.get('createdBy');
    
    // Build filter conditions
    const where: any = {
      status: 'open' // Only show open requests by default
    };
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (createdBy) {
      where.creatorId = createdBy;
      delete where.status; // Show all statuses for creator's own requests
    }
    
    // Date filter: only show future requests (today or later)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const requests = await db.golfPartnerRequest.findMany({
      where: {
        ...where,
        date: {
          gte: today
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            handicap: true,
            avatar: true,
            city: true,
            country: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handicap: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
    
    // If userId is provided, mark which requests the user has joined
    let enhancedRequests = requests;
    if (userId) {
      enhancedRequests = requests.map(req => ({
        ...req,
        hasJoined: req.participants.some(p => p.userId === userId),
        isCreator: req.creatorId === userId,
        participantCount: req.participants.length
      }));
    }
    
    return NextResponse.json({ requests: enhancedRequests });
  } catch (error) {
    console.error('Error fetching partner requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new partner request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, courseId, date, time, notes, maxPlayers } = body;
    
    if (!creatorId || !courseId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the request
    const partnerRequest = await db.golfPartnerRequest.create({
      data: {
        creatorId,
        courseId,
        date: new Date(date),
        time,
        notes: notes || null,
        maxPlayers: maxPlayers || 4,
        status: 'open'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            handicap: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true
          }
        }
      }
    });
    
    // Auto-join the creator to their own request
    await db.golfPartnerRequestParticipant.create({
      data: {
        requestId: partnerRequest.id,
        userId: creatorId
      }
    });
    
    return NextResponse.json({ request: partnerRequest });
  } catch (error) {
    console.error('Error creating partner request:', error);
    return NextResponse.json(
      { error: 'Failed to create partner request' },
      { status: 500 }
    );
  }
}

// PUT - Update a partner request (status, notes, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, status, notes } = body;
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user is the creator
    const existingRequest = await db.golfPartnerRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    if (existingRequest.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the creator can update this request' },
        { status: 403 }
      );
    }
    
    const updatedRequest = await db.golfPartnerRequest.update({
      where: { id },
      data: {
        status: status || existingRequest.status,
        notes: notes !== undefined ? notes : existingRequest.notes,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            handicap: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            city: true,
            region: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                handicap: true,
                avatar: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating partner request:', error);
    return NextResponse.json(
      { error: 'Failed to update partner request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a partner request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the user is the creator
    const existingRequest = await db.golfPartnerRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    if (existingRequest.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the creator can delete this request' },
        { status: 403 }
      );
    }
    
    // Delete participants first (cascade should handle this, but let's be explicit)
    await db.golfPartnerRequestParticipant.deleteMany({
      where: { requestId: id }
    });
    
    // Delete the request
    await db.golfPartnerRequest.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting partner request:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner request' },
      { status: 500 }
    );
  }
}
