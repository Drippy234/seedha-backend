const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSignup() {
  try {
    console.log('🧪 Testing Signup Endpoint...\n');

    // Test 1: Check if server is reachable
    console.log('1️⃣ Checking if server is running...');
    const healthCheck = await axios.get('http://localhost:5000');
    console.log('✅ Server is running:', healthCheck.data);
    console.log();

    // Test 2: Try to register a new user
    console.log('2️⃣ Testing user registration...');
    const signupData = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      phone: '1234567890',
      password: 'password123',
      role: 'customer'
    };

    console.log('Sending signup request with data:', signupData);
    const response = await axios.post(`${BASE_URL}/users/register`, signupData);
    
    console.log('✅ Signup successful!');
    console.log('Response:', response.data);
    console.log();

    // Test 3: Check what frontend URL should be
    console.log('3️⃣ Frontend Connection Info:');
    console.log('Backend URL: http://localhost:5000');
    console.log('Signup Endpoint: http://localhost:5000/api/users/register');
    console.log('Login Endpoint: http://localhost:5000/api/users/login');
    console.log();

    console.log('✅ All tests passed! Backend is ready for frontend connection.');

  } catch (error) {
    console.error('❌ Error during signup test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Make sure backend is running on http://localhost:5000');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSignup();
