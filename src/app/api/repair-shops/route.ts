import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSuperAdminEmail } from '@/lib/super-admin';

// Validation schema for repair shop
const repairShopSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  manager: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  activeSince: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET /api/repair-shops - List all repair shops with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const where: {
      isActive: boolean;
      country?: string;
      city?: string;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        manager?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
    } = { isActive: true };

    if (country && country !== 'all') {
      where.country = country;
    }

    if (city && city !== 'all') {
      where.city = city;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manager: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const shops = await db.repairShop.findMany({
      where,
      orderBy: [
        { country: 'asc' },
        { city: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get unique countries and cities for filters
    const allShops = await db.repairShop.findMany({
      where: { isActive: true },
      select: { country: true, city: true },
    });

    const countries = [...new Set(allShops.map(s => s.country))].sort();
    const cities = [...new Set(allShops.map(s => s.city))].sort();

    return NextResponse.json({
      shops,
      filters: { countries, cities },
    });
  } catch (error) {
    console.error('Error fetching repair shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repair shops' },
      { status: 500 }
    );
  }
}

// POST /api/repair-shops - Create a new repair shop (super admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const validated = repairShopSchema.parse(body);

    const shop = await db.repairShop.create({
      data: {
        name: validated.name,
        manager: validated.manager || null,
        city: validated.city,
        country: validated.country,
        phone: validated.phone || null,
        email: validated.email || null,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        activeSince: validated.activeSince ? new Date(validated.activeSince) : null,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error creating repair shop:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create repair shop' },
      { status: 500 }
    );
  }
}

// PUT /api/repair-shops - Update a repair shop (super admin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin session
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const validated = repairShopSchema.partial().parse(data);

    const shop = await db.repairShop.update({
      where: { id },
      data: {
        ...validated,
        activeSince: validated.activeSince ? new Date(validated.activeSince) : undefined,
      },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Error updating repair shop:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update repair shop' },
      { status: 500 }
    );
  }
}

// DELETE /api/repair-shops - Delete a repair shop (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.adminSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    await db.repairShop.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair shop:', error);
    return NextResponse.json(
      { error: 'Failed to delete repair shop' },
      { status: 500 }
    );
  }
}
