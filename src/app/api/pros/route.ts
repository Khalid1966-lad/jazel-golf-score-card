import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - List all golf pros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const sortBy = searchParams.get('sortBy') || 'name'; // 'name' or 'city'

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (city) {
      where.city = city;
    }

    const pros = await db.golfPro.findMany({
      where,
      orderBy: sortBy === 'city' ? [{ city: 'asc' }, { name: 'asc' }] : { name: 'asc' },
    });

    // Get unique cities for filter
    const cities = await db.golfPro.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });

    return NextResponse.json({
      pros,
      cities: cities.map(c => c.city),
    });
  } catch (error) {
    console.error('Error fetching golf pros:', error);
    return NextResponse.json({ error: 'Failed to fetch golf pros' }, { status: 500 });
  }
}

// POST - Create a new golf pro (super admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Super admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, avatar, phone, address, city, country, email, description, yearBecamePro, specialties } = body;

    if (!name || !city) {
      return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
    }

    const pro = await db.golfPro.create({
      data: {
        name,
        avatar: avatar || null,
        phone: phone || null,
        address: address || null,
        city,
        country: country || 'Morocco',
        email: email || null,
        description: description || null,
        yearBecamePro: yearBecamePro ? parseInt(yearBecamePro) : null,
        specialties: specialties || null,
      },
    });

    return NextResponse.json({ pro });
  } catch (error) {
    console.error('Error creating golf pro:', error);
    return NextResponse.json({ error: 'Failed to create golf pro' }, { status: 500 });
  }
}

// PUT - Update a golf pro (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Super admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, avatar, phone, address, city, country, email, description, yearBecamePro, specialties, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Pro ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country || 'Morocco';
    if (email !== undefined) updateData.email = email || null;
    if (description !== undefined) updateData.description = description || null;
    if (yearBecamePro !== undefined) updateData.yearBecamePro = yearBecamePro ? parseInt(yearBecamePro) : null;
    if (specialties !== undefined) updateData.specialties = specialties || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const pro = await db.golfPro.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ pro });
  } catch (error) {
    console.error('Error updating golf pro:', error);
    return NextResponse.json({ error: 'Failed to update golf pro' }, { status: 500 });
  }
}

// DELETE - Delete a golf pro (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Super admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Pro ID is required' }, { status: 400 });
    }

    await db.golfPro.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting golf pro:', error);
    return NextResponse.json({ error: 'Failed to delete golf pro' }, { status: 500 });
  }
}
