const express = require('express');
const router = express.Router();
const {
  getSupportOverview,
  getSupportTopics,
  getSupportOrders,
  initOrderChat,
  initGeneralChat,
  createSupportCase,
  getUserSupportCases,
  closeCase,
  getCaseDetails,
  sendCaseMessage,
  markCaseMessagesAsRead,
  getSupportArticles
} = require('../controllers/supportController');
const { protect } = require('../middlewares/authMiddleware');

// Public or optional auth
router.get('/articles', getSupportArticles);

// Customer protected routes
router.get('/overview', protect, getSupportOverview);
router.get('/topics', protect, getSupportTopics);
router.get('/orders', protect, getSupportOrders);
router.get('/orders/:orderId/init', protect, initOrderChat);
router.get('/general/init', protect, initGeneralChat);

router.route('/cases')
  .get(protect, getUserSupportCases)
  .post(protect, createSupportCase);

router.route('/cases/:id')
  .get(protect, getCaseDetails);

router.patch('/cases/:id/close', protect, closeCase);
router.patch('/cases/:id/read', protect, markCaseMessagesAsRead);
router.post('/cases/:id/messages', protect, sendCaseMessage);

module.exports = router;
