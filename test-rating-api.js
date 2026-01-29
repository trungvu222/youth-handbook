// Quick test to check if Rating API is working

// Using Node.js built-in fetch (Node 18+)

async function testRatingAPI() {
  try {
    console.log('🔍 Testing Rating API...');
    
    // Test health endpoint first
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Backend is running:', health.status);
    } else {
      console.log('❌ Backend health check failed');
      return;
    }

    // Test rating endpoint (should return 401 without auth)
    const ratingResponse = await fetch('http://localhost:3001/api/rating/periods');
    console.log(`📊 Rating API status: ${ratingResponse.status}`);
    
    if (ratingResponse.status === 401) {
      console.log('✅ Rating API is working (returns 401 as expected without auth)');
    } else if (ratingResponse.status === 404) {
      console.log('❌ Rating API not found - routes may not be loaded');
    } else {
      console.log(`⚠️ Unexpected status: ${ratingResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testRatingAPI();
