import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Join a partner request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, userId } = body;
    
    if (!requestId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if the request exists and is open
    const partnerRequest = await db.golfPartnerRequest.findUnique({
      where: { id: requestId },
      include: {
        participants: true
      }
    });
    
    if (!partnerRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    if (partnerRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'This request is no longer open' },
        { status: 400 }
      );
    }
    
    // Check if the request is full
    if (partnerRequest.participants.length >= partnerRequest.maxPlayers) {
      return NextResponse.json(
        { error: 'This request is full' },
        { status: 400 }
      );
    }
    
    // Check if user already joined
    const existingParticipant = await db.golfPartnerRequestParticipant.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });
    
    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this request' },
        { status: 400 }
      );
    }
    
    // Join the request
    const participant = await db.golfPartnerRequestParticipant.create({
      data: {
        requestId,
        userId
      },
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
    });
    
    // Check if request is now full and update status
    const updatedParticipants = await db.golfPartnerRequestParticipant.count({
      where: { requestId }
    });
    
    if (updatedParticipants >= partnerRequest.maxPlayers) {
      await db.golfPartnerRequest.update({
        where: { id: requestId },
        data: { status: 'filled' }
      });
    }
    
    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Error joining partner request:', error);
    return NextResponse.json(
      { error: 'Failed to join partner request' },
      { status: 500 }
    );
  }
}

// DELETE - Leave a partner request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const userId = searchParams.get('userId');
    
    if (!requestId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if the participant exists
    const participant = await db.golfPartnerRequestParticipant.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });
    
    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this request' },
        { status: 404 }
      );
    }
    
    // Check if user is the creator
    const partnerRequest = await db.golfPartnerRequest.findUnique({
      where: { id: requestId }
    });
    
    if (partnerRequest && partnerRequest.creatorId === userId) {
      return NextResponse.json(
        { error: 'The creator cannot leave their own request. Delete the request instead.' },
        { status: 400 }
      );
    }
    
    // Leave the request
    await db.golfPartnerRequestParticipant.delete({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });
    
    // If request was filled, set it back to open
    if (partnerRequest && partnerRequest.status === 'filled') {
      const currentParticipants = await db.golfPartnerRequestParticipant.count({
        where: { requestId }
      });
      
      if (currentParticipants < partnerRequest.maxPlayers) {
        await db.golfPartnerRequest.update({
          where: { id: requestId },
          data: { status: 'open' }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving partner request:', error);
    return NextResponse.json(
      { error: 'Failed to leave partner request' },
      { status: 500 }
    );
  }
}
