const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.booking.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const admin = await prisma.user.create({
    data: { name: 'Admin Flow', email: 'admin@raahlink.com', loyaltyTier: 'PLATINUM', loyaltyPoints: 50000 },
  });
  const userA = await prisma.user.create({
    data: { name: 'John Doe', email: 'john@raahlink.com', loyaltyTier: 'STANDARD', loyaltyPoints: 500 },
  });
  const userB = await prisma.user.create({
    data: { name: 'Jane Gold', email: 'jane@raahlink.com', loyaltyTier: 'GOLD', loyaltyPoints: 12000 },
  });

  console.log('Seeding Flights...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  await prisma.flight.createMany({
    data: [
      {
        flightNumber: 'RL-101',
        origin: 'Mumbai (BOM)',
        destination: 'Delhi (DEL)',
        departureTime: tomorrow,
        arrivalTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        economyCapacity: 2, // low capacity for testing overbooking
        businessCapacity: 1, // testing upgrades
        economyCount: 0,
        businessCount: 0,
        basePriceEx: 5000,
        basePriceBz: 15000,
      },
      {
        flightNumber: 'RL-205',
        origin: 'Bengaluru (BLR)',
        destination: 'Goa (GOI)',
        departureTime: nextWeek,
        arrivalTime: new Date(nextWeek.getTime() + 1.5 * 60 * 60 * 1000),
        economyCapacity: 100,
        businessCapacity: 10,
        economyCount: 0,
        businessCount: 0,
        basePriceEx: 4000,
        basePriceBz: 12000,
      },
    ],
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
