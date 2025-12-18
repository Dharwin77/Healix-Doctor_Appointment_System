// Test Digital Samba API connectivity
require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');

const DIGITAL_SAMBA_BASE_URL = process.env.DIGITAL_SAMBA_BASE_URL;
const DEVELOPER_KEY = process.env.DEVELOPER_KEY;
const TEAM_ID = process.env.TEAM_ID;
const SUBDOMAIN = process.env.SUBDOMAIN;

console.log('Testing Digital Samba API...\n');
console.log('Configuration:');
console.log('- Base URL:', DIGITAL_SAMBA_BASE_URL);
console.log('- Team ID:', TEAM_ID);
console.log('- Subdomain:', SUBDOMAIN);
console.log('- API Key:', DEVELOPER_KEY ? `${DEVELOPER_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('\n');

async function testAPI() {
  try {
    // Test 1: Get rooms
    console.log('Test 1: Fetching existing rooms...');
    const response = await axios({
      method: 'GET',
      url: `${DIGITAL_SAMBA_BASE_URL}/api/v1/rooms`,
      headers: {
        'Authorization': `Bearer ${DEVELOPER_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS: API is accessible');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    
    // Test 2: Create a test room
    console.log('Test 2: Creating a test room...');
    const roomData = {
      team_id: TEAM_ID,
      friendly_url: 'test-' + Math.random().toString(36).substring(7),
      privacy: 'public',
      name: 'Test Room - Healix Video Call',
      description: 'Test room created by Healix to verify integration',
      features: {
        chat: true,
        screen_sharing: true,
        recording: true,
        whiteboard: true
      }
    };
    
    console.log('Creating room with data:', JSON.stringify(roomData, null, 2));
    
    const createResponse = await axios({
      method: 'POST',
      url: `${DIGITAL_SAMBA_BASE_URL}/api/v1/rooms`,
      headers: {
        'Authorization': `Bearer ${DEVELOPER_KEY}`,
        'Content-Type': 'application/json'
      },
      data: roomData
    });
    
    console.log('✅ SUCCESS: Room created');
    console.log('Room details:', JSON.stringify(createResponse.data, null, 2));
    console.log('\n');
    console.log('🎉 VIDEO CALL INTEGRATION IS WORKING!');
    console.log(`Room URL: https://${SUBDOMAIN}.digitalsamba.com/${roomData.friendly_url}`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n');
    console.log('🔴 VIDEO CALL INTEGRATION HAS ISSUES');
    
    // Provide troubleshooting tips
    console.log('\nTroubleshooting:');
    if (error.response?.status === 401) {
      console.log('- Check that DEVELOPER_KEY is correct');
      console.log('- Verify the API key in Digital Samba dashboard');
    } else if (error.response?.status === 404) {
      console.log('- Check that DIGITAL_SAMBA_BASE_URL is correct');
      console.log('- Verify the endpoint path');
    } else if (error.response?.status === 400) {
      console.log('- Check that TEAM_ID is correct');
      console.log('- Verify room data format matches API requirements');
    }
  }
}

testAPI();
