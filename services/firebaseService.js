const admin = require('firebase-admin');
const pool = require('../config/db');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Decode the Base64 string from env
      const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decodedKey);
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      // Require the JSON file directly
      serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
    } else {
      console.warn('Firebase Service Account not configured. Push notifications will not work.');
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

/**
 * Fetch all FCM tokens for a given user from the database
 * @param {Number} userId
 * @returns {Promise<String[]>}
 */
const getUserTokens = async (userId) => {
  const result = await pool.query('SELECT token FROM user_fcm_tokens WHERE user_id = $1', [userId]);
  return result.rows.map(row => row.token);
};

/**
 * Send a push notification to a specific user
 * @param {Number} userId The ID of the user to send to
 * @param {String} title The title of the notification
 * @param {String} body The body text of the notification
 * @param {Object} data Any custom data to send along with the notification (optional)
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!admin.apps.length) {
      console.warn('Firebase Admin SDK not initialized, skipping push notification');
      return;
    }

    const tokens = await getUserTokens(userId);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}, skipping notification.`);
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // Common default for Flutter apps
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Push notification sent to user ${userId}:`, response.successCount, 'successes,', response.failureCount, 'failures');

    // Optionally clean up invalid tokens if failureCount > 0
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokens[idx]);
          }
        }
      });
      
      if (failedTokens.length > 0) {
        await pool.query('DELETE FROM user_fcm_tokens WHERE token = ANY($1)', [failedTokens]);
        console.log(`Cleaned up ${failedTokens.length} invalid FCM tokens for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification
};
