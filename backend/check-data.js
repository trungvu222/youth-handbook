const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        email: true
      }
    });

    console.log(`👥 Users (${users.length}):`)
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} | Username: ${user.username} | Name: ${user.fullName} | Role: ${user.role}`);
      });
    } else {
      console.log('  No users found');
    }

    // Check documents
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true
      }
    });

    console.log(`\n📄 Documents (${documents.length}):`)
    if (documents.length > 0) {
      documents.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.title} (${doc.status}) - Author: ${doc.authorId}`);
      });
    } else {
      console.log('  No documents found');
    }

    // Check exams
    const exams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true
      }
    });

    console.log(`\n🧠 Exams (${exams.length}):`)
    if (exams.length > 0) {
      exams.forEach((exam, index) => {
        console.log(`  ${index + 1}. ${exam.title} (${exam.status}) - Author: ${exam.authorId}`);
      });
    } else {
      console.log('  No exams found');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

