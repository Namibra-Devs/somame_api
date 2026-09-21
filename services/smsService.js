/**
 * Arkesel SMS Service Integration
 */

const sendSMS = async (phoneNumber, message) => {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID || 'Somame';

  if (!apiKey || apiKey === 'your_arkesel_api_key_here') {
    console.warn('\n[WARNING] ARKESEL_API_KEY is not set or invalid. Falling back to mock SMS.');
    console.log(`\n\n[MOCK SMS] To: ${phoneNumber} | Message: ${message}\n\n`);
    return { status: 'success', message: 'Mock SMS sent' };
  }

  // Format phone number (Arkesel typically requires international format without the '+')
  // Example for Ghana: 0241234567 -> 233241234567
  let formattedNumber = phoneNumber;
  if (formattedNumber.startsWith('0')) {
    // Defaulting to Ghana country code (233). Adjust this if your users are from elsewhere.
    formattedNumber = '233' + formattedNumber.substring(1);
  }
  // Remove any '+' sign if it exists
  if (formattedNumber.startsWith('+')) {
    formattedNumber = formattedNumber.substring(1);
  }

  try {
    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: senderId,
        message: message,
        recipients: [formattedNumber],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      console.error('[SMS ERROR] Arkesel API Error:', data);
      throw new Error(data.message || 'Failed to send SMS via Arkesel');
    }

    console.log(`[SMS SUCCESS] Sent to ${formattedNumber} via Arkesel. Response:`, JSON.stringify(data));
    return { status: 'success', data };
  } catch (error) {
    console.error('[SMS EXCEPTION]', error);
    // Don't throw to prevent crashing the main flow if SMS fails, just log it.
    // Or depending on the flow, we might want to return an error status.
    return { status: 'error', message: 'Could not connect to Arkesel SMS API', error: error.message };
  }
};

module.exports = {
  sendSMS,
};
