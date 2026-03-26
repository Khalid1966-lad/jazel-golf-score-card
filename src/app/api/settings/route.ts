import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory settings store (for demo purposes)
// In production, this would use a database
const appSettings = {
  maxNearbyDistance: 100,
};

// GET - Retrieve settings
export async function GET() {
  try {
    return NextResponse.json({
      maxNearbyDistance: appSettings.maxNearbyDistance,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ maxNearbyDistance: 100 });
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { maxNearbyDistance } = body;
    
    if (maxNearbyDistance !== undefined) {
      appSettings.maxNearbyDistance = parseInt(maxNearbyDistance) || 100;
    }
    
    return NextResponse.json({ success: true, maxNearbyDistance: appSettings.maxNearbyDistance });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
