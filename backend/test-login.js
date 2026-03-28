const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('Checking admin user...');
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { email: 'admin' },
          { phone: 'admin' }
        ],
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  isActive:', user.isActive);
    console.log('  Password hash length:', user.passwordHash?.length || 0);
    console.log('  Password hash exists:', !!user.passwordHash);
    
    if (!user.passwordHash) {
      console.log('❌ No password hash!');
      process.exit(1);
    }

    console.log('\nTesting password compare...');
    const testPassword = '123456';
    const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password "123456" matches:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match!');
      console.log('Hash starts with:', user.passwordHash.substring(0, 20));
    } else {
      console.log('✅ Password matches! Login should work.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
