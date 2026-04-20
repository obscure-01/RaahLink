import { NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: Number(userId) },
      include: {
        flight: true
      },
      orderBy: { bookingTime: 'desc' }
    });
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
