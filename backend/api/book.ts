import { NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, flightId, requestedClass } = await req.json();

    if (!userId || !flightId || !requestedClass) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Wrap in a transaction to ensure no race conditions
    const result = await prisma.$transaction(async (tx) => {
      const flight = await tx.flight.findUnique({
        where: { id: flightId },
      });
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!flight || !user) {
        throw new Error('Flight or User not found');
      }

      let status = 'CONFIRMED';
      let finalClass = requestedClass;
      let upgradeMessage = null;

      if (requestedClass === 'ECONOMY') {
        const overbookThreshold = Math.ceil(flight.economyCapacity * 0.1); // At least 1 seat buffer
        const maxEconomyAllowed = flight.economyCapacity + overbookThreshold;

        if (flight.economyCount >= flight.economyCapacity) {
          // Economy is full. Check for upgrade logic!
          const isHighTier = ['GOLD', 'PLATINUM'].includes(user.loyaltyTier);
          const hasBusinessSeats = flight.businessCount < flight.businessCapacity;

          if (isHighTier && hasBusinessSeats) {
            // Upgrade to business
            finalClass = 'BUSINESS';
            upgradeMessage = `Complimentary upgrade to BUSINESS class applied due to your ${user.loyaltyTier} status!`;
            
            // Increment business count
            await tx.flight.update({
              where: { id: flight.id },
              data: { businessCount: flight.businessCount + 1 }
            });
          } else {
            // Cannot upgrade. Can we overbook/waitlist?
            if (flight.economyCount >= maxEconomyAllowed) {
              // Beyond overbooking threshold -> WAITLISTED
              status = 'WAITLISTED';
            } else {
              // Within overbooking threshold
              status = 'CONFIRMED_OVERBOOKED';
              upgradeMessage = 'Notice: Flight is overbooked. Confirm seat assignment at gate.';
              await tx.flight.update({
                where: { id: flight.id },
                data: { economyCount: flight.economyCount + 1 }
              });
            }
          }
        } else {
          // Normal booking in Economy
          await tx.flight.update({
            where: { id: flight.id },
            data: { economyCount: flight.economyCount + 1 }
          });
        }
      } else if (requestedClass === 'BUSINESS') {
        if (flight.businessCount >= flight.businessCapacity) {
          status = 'WAITLISTED';
        } else {
          await tx.flight.update({
            where: { id: flight.id },
            data: { businessCount: flight.businessCount + 1 }
          });
        }
      }

      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          flightId: flight.id,
          status,
          fareClass: finalClass,
        }
      });

      return { booking, upgradeMessage };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Booking failed' }, { status: 500 });
  }
}
