import { NextResponse } from 'next/server';
import { prisma } from '../lib/prisma';

export async function GET() {
  try {
    const flights = await prisma.flight.findMany({
      orderBy: { departureTime: 'asc' },
      include: {
        bookings: true, // We can optionally remove this later to just use economyCount/businessCount
      }
    });
    
    // Add dynamic availability fields
    const enrichedFlights = flights.map(flight => {
        const economyAvailable = flight.economyCapacity - flight.economyCount;
        const businessAvailable = flight.businessCapacity - flight.businessCount;
        return {
            ...flight,
            economySeatsAvailable: economyAvailable > 0 ? economyAvailable : 0,
            businessSeatsAvailable: businessAvailable > 0 ? businessAvailable : 0,
            isEconomyOverbooked: flight.economyCount > flight.economyCapacity,
            isBusinessFull: flight.businessCount >= flight.businessCapacity
        }
    });

    return NextResponse.json(enrichedFlights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
