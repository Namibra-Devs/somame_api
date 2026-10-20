const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { pool } = require('../config/db');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decodedKey);
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
    } else {
      console.warn('Firebase Service Account not configured. Push notifications will use Socket.io only.');
      return;
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
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
  return result.rows.map((row) => row.token);
};

/**
 * Send a real-time notification via Socket.io (for Web Portal & live connected clients)
 * and Firebase Cloud Messaging (for mobile devices with registered FCM tokens).
 * @param {Number} userId The ID of the user to send to
 * @param {String} title The title of the notification
 * @param {String} body The body text of the notification
 * @param {Object} data Any custom data to send along with the notification (optional)
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // 1. Emit real-time Socket.io notification to user's personal room (Web & connected clients)
    if (ioInstance && userId) {
      ioInstance.to(`user_${userId}`).emit('notification', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        body,
        data,
        read: false,
        created_at: new Date().toISOString()
      });
    }

    // 2. Send FCM push notification if Firebase is initialized and the user has mobile tokens
    if (getApps().length === 0) {
      return;
    }

    const tokens = await getUserTokens(userId);
    if (tokens.length === 0) {
      return;
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens
    };

    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`Push notification sent to user ${userId}:`, response.successCount, 'successes,', response.failureCount, 'failures');

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
    console.error(`Error sending notification to user ${userId}:`, error);
  }
};

module.exports = {
  initializeFirebase,
  setSocketIO,
  sendPushNotification
};
