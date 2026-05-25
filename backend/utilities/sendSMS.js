const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// const sendSMS = async (to, message) => {
//   await client.messages.create({
//     body: message,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: to,
//   });
// };

// Academic / Development SMS Simulation
// utilities/sendSMS.js
const sendSMS = async (phoneNumber, message) => {
  console.log('==============================');
  console.log('📱 SMS SIMULATION (Academic)');
  console.log('To:', phoneNumber);
  console.log('Message:', message);
  console.log('==============================');
};

module.exports = sendSMS;
