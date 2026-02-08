// Test script to check the email service endpoint
const axios = require('axios');

const testEmailService = async () => {
  const endpoint = 'https://send-resent-mail-646827ff1a0b.herokuapp.com';
  
  const payload = {
    from: "test@alerts.myclinicmd.com",
    recipients: ["test@example.com"],
    subject: "Test Email",
    html: "<p>This is a test email</p>",
  };

  try {
    console.log('Testing email service at:', endpoint);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    
    console.log('Success! Response:', response.data);
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
};

testEmailService();
