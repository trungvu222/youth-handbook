const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  try {
    // Find borrowings where returnedAt is set but should be null (borrowed recently)
    const recentBorrowings = await prisma.bookBorrowing.findMany({
      where: {
        returnedAt: { not: null },
        borrowedAt: { gte: new Date('2024-01-01') } // recent borrowings
      }
    });

    console.log('Found', recentBorrowings.length, 'recent borrowings with returnedAt set');

    for (const borrowing of recentBorrowings) {
      // If returnedAt is in the future, it's likely a due date, not actual return date
      if (new Date(borrowing.returnedAt) > new Date()) {
        await prisma.bookBorrowing.update({
          where: { id: borrowing.id },
          data: {
            dueDate: borrowing.returnedAt,
            returnedAt: null
          }
        });
        console.log('Migrated borrowing', borrowing.id);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();