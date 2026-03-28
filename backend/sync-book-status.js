const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncBookStatus() {
  try {
    console.log('Syncing book isBorrowed status...');

    // Get all books with their current borrowing status
    const books = await prisma.book.findMany({
      include: {
        borrowings: {
          where: { returnedAt: null },
          take: 1
        }
      }
    });

    console.log(`Found ${books.length} books to check`);

    let updatedCount = 0;
    for (const book of books) {
      const shouldBeBorrowed = book.borrowings.length > 0;
      const isCurrentlyBorrowed = book.isBorrowed || false;

      if (shouldBeBorrowed !== isCurrentlyBorrowed) {
        await prisma.book.update({
          where: { id: book.id },
          data: { isBorrowed: shouldBeBorrowed }
        });
        updatedCount++;
        console.log(`Updated book "${book.title}": isBorrowed = ${shouldBeBorrowed}`);
      }
    }

    console.log(`Sync completed. Updated ${updatedCount} books.`);
  } catch (error) {
    console.error('Sync error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncBookStatus();