import fetch from 'node-fetch';

async function debugMentorMiddleware() {
  const BASE_URL = 'http://localhost:3000';
  
  try {
    // First check if server is responding
    console.log('🔍 Testing server connection...');
    const healthResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    console.log('Server connection status:', healthResponse.status);
    
    // Test a simple endpoint first
    console.log('\n🔍 Testing basic mentor endpoint with no auth...');
    const noAuthResponse = await fetch(`${BASE_URL}/api/mentor/projects`);
    console.log('No auth status:', noAuthResponse.status);
    console.log('No auth response:', await noAuthResponse.text());

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMentorMiddleware();
