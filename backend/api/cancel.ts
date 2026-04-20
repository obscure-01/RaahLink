import { NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'CANCELLED') throw new Error('Booking is already cancelled');

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });

      // Restore seats based on what was booked and what the status was
      // Waitlisted users didn't actually take a confirmed seat, so we only restore if they had CONFIRMED or CONFIRMED_OVERBOOKED
      if (booking.status !== 'WAITLISTED') {
        const flight = await tx.flight.findUnique({ where: { id: booking.flightId } });
        if (flight) {
          if (booking.fareClass === 'ECONOMY') {
            await tx.flight.update({
              where: { id: flight.id },
              data: { economyCount: Math.max(0, flight.economyCount - 1) }
            });
          } else if (booking.fareClass === 'BUSINESS') {
            await tx.flight.update({
              where: { id: flight.id },
              data: { businessCount: Math.max(0, flight.businessCount - 1) }
            });
          }
        }
      }

      return updatedBooking;
    });

    return NextResponse.json({ success: true, booking: result });

  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel booking' }, { status: 500 });
  }
}
