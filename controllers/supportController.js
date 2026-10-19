const SupportCase = require('../models/SupportCase');
const SupportMessage = require('../models/SupportMessage');
const SupportArticle = require('../models/SupportArticle');
const { pool } = require('../config/db');

// --- Helper Functions for Formatting ---
const formatOrderDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dayName} ${dayNum} ${monthName}, ${year} ${hours}:${minutes}`;
};

const formatChatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
};

const formatChatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
};

const formatMonthYear = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Generate 10-digit Case Number e.g. 2324242424
const generateCaseNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// @desc    Get support home overview (Screen 1 & Screen 5)
// @route   GET /api/support/overview
const getSupportOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's active/recent support cases
    const cases = await SupportCase.findByUserId(userId, 5);

    // 2. Fetch user's recent orders with vendor details
    const recentOrdersQuery = `
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
             v.name as vendor_name, v.logo_url as vendor_logo
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      LIMIT 2;
    `;
    const ordersResult = await pool.query(recentOrdersQuery, [userId]);

    const formattedOrders = ordersResult.rows.map(order => ({
      ...order,
      currency: 'GHC',
      formatted_date: formatOrderDate(order.created_at),
      display_total: `GHC${Math.round(parseFloat(order.total_amount))}`
    }));

    const formattedCases = cases.map(c => ({
      ...c,
      display_case_number: `Case ${c.case_number}`,
      formatted_time: formatChatTime(c.last_message_at),
      formatted_date: formatChatDate(c.last_message_at)
    }));

    res.status(200).json({
      status: 'success',
      message: 'Support overview retrieved successfully',
      data: {
        has_cases: formattedCases.length > 0,
        cases: formattedCases,
        recent_orders: formattedOrders,
        navigation_links: [
          { key: 'contact_agent', title: 'Contact a Support Agent' },
          { key: 'browse_articles', title: 'Browse help articles' },
          { key: 'cases', title: 'Cases' }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for order selection (Screen 2)
// @route   GET /api/support/orders
const getSupportOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const ordersQuery = `
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
             v.name as vendor_name, v.logo_url as vendor_logo
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC;
    `;
    const ordersResult = await pool.query(ordersQuery, [userId]);

    // Format orders and group by month & year
    const groupedMap = new Map();

    const formattedOrders = ordersResult.rows.map(order => {
      const monthYear = formatMonthYear(order.created_at);
      const item = {
        ...order,
        currency: 'GHC',
        formatted_date: formatOrderDate(order.created_at),
        display_total: `GHC${Math.round(parseFloat(order.total_amount))}`
      };

      if (!groupedMap.has(monthYear)) {
        groupedMap.set(monthYear, []);
      }
      groupedMap.get(monthYear).push(item);

      return item;
    });

    const grouped = [];
    groupedMap.forEach((orders, month_year) => {
      grouped.push({ month_year, orders });
    });

    res.status(200).json({
      status: 'success',
      message: 'Support orders retrieved successfully',
      data: {
        grouped,
        orders: formattedOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize chat context for a selected order (Screen 3)
// @route   GET /api/support/orders/:orderId/init
const initOrderChat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.orderId;

    // Check if order exists and belongs to customer
    const orderQuery = `
      SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
             v.name as vendor_name, v.logo_url as vendor_logo
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      WHERE o.id = $1 AND o.customer_id = $2;
    `;
    const orderResult = await pool.query(orderQuery, [orderId, userId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check if there is already an open active case for this order
    const existingCase = await SupportCase.findOpenByOrderId(orderId, userId);
    let existingMessages = [];
    if (existingCase) {
      const msgs = await SupportMessage.findByCaseId(existingCase.id);
      existingMessages = msgs.map(m => ({
        ...m,
        formatted_time: formatChatTime(m.created_at),
        formatted_date: formatChatDate(m.created_at)
      }));
    }

    const now = new Date();
    const defaultBotMessage = {
      sender_type: 'system',
      sender_name: 'Somame Support',
      message: `Hey! How can we help you with your order with ${order.vendor_name}`,
      created_at: now.toISOString(),
      formatted_time: formatChatTime(now),
      formatted_date: formatChatDate(now)
    };

    res.status(200).json({
      status: 'success',
      message: 'Chat context initialized',
      data: {
        order: {
          ...order,
          currency: 'GHC',
          formatted_date: formatOrderDate(order.created_at),
          display_total: `GHC${Math.round(parseFloat(order.total_amount))}`
        },
        has_existing_case: !!existingCase,
        existing_case: existingCase ? {
          ...existingCase,
          display_case_number: `Case ${existingCase.case_number}`,
          messages: existingMessages
        } : null,
        default_bot_message: defaultBotMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new support case & send initial message (Screen 4)
// @route   POST /api/support/cases
const createSupportCase = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { order_id, parcel_order_id, message, attachments } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Please provide a message describing your issue' });
    }

    let vendorName = '';
    let subject = 'General Inquiry';

    if (order_id) {
      const orderQuery = `
        SELECT o.order_number, v.name as vendor_name 
        FROM orders o 
        JOIN vendors v ON o.vendor_id = v.id 
        WHERE o.id = $1;
      `;
      const ordRes = await pool.query(orderQuery, [order_id]);
      if (ordRes.rows.length > 0) {
        vendorName = ordRes.rows[0].vendor_name;
        subject = `Order with ${vendorName}`;
      }
    } else if (parcel_order_id) {
      const parcelQuery = `SELECT order_number FROM parcel_orders WHERE id = $1;`;
      const pRes = await pool.query(parcelQuery, [parcel_order_id]);
      if (pRes.rows.length > 0) {
        subject = `Parcel ${pRes.rows[0].order_number}`;
      }
    }

    // Generate unique 10-digit case number
    let caseNumber = generateCaseNumber();
    let isUnique = false;
    while (!isUnique) {
      const existing = await SupportCase.findByCaseNumber(caseNumber);
      if (!existing) {
        isUnique = true;
      } else {
        caseNumber = generateCaseNumber();
      }
    }

    // 1. Create support case
    const supportCase = await SupportCase.create({
      case_number: caseNumber,
      user_id: userId,
      order_id: order_id || null,
      parcel_order_id: parcel_order_id || null,
      subject,
      status: 'open',
      priority: 'medium',
      last_message: message
    });

    // 2. Insert initial system/bot welcome message
    const botText = vendorName
      ? `Hey! How can we help you with your order with ${vendorName}`
      : 'Hey! How can we help you today?';

    const botMessage = await SupportMessage.create({
      case_id: supportCase.id,
      sender_id: null,
      sender_type: 'system',
      message: botText
    });

    // 3. Insert customer message
    const customerMessage = await SupportMessage.create({
      case_id: supportCase.id,
      sender_id: userId,
      sender_type: 'customer',
      message,
      attachments: attachments || []
    });

    // 4. Emit socket event to notify admins/support room
    const io = req.app.get('io');
    if (io) {
      io.to('support_agents').emit('new_support_case', {
        case: supportCase,
        messages: [botMessage, customerMessage]
      });
    }

    const messages = [
      {
        ...botMessage,
        formatted_time: formatChatTime(botMessage.created_at),
        formatted_date: formatChatDate(botMessage.created_at)
      },
      {
        ...customerMessage,
        formatted_time: formatChatTime(customerMessage.created_at),
        formatted_date: formatChatDate(customerMessage.created_at)
      }
    ];

    res.status(201).json({
      status: 'success',
      message: 'Support case created successfully',
      data: {
        ...supportCase,
        display_case_number: `Case ${supportCase.case_number}`,
        vendor_name: vendorName,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get support help options / sample queries (Screen 100)
// @route   GET /api/support/topics
const getSupportTopics = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Support topics retrieved successfully',
      data: {
        title: 'How can we help you',
        topics: [
          {
            id: 'order_help',
            title: 'I need help with an order',
            action: 'NAVIGATE_SELECT_ORDER',
            route: '/api/support/orders'
          },
          {
            id: 'something_else',
            title: 'Something else',
            action: 'NAVIGATE_GENERAL_CHAT',
            route: '/api/support/general/init'
          }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize general chat context for "Something else" (Screen 101)
// @route   GET /api/support/general/init
const initGeneralChat = async (req, res, next) => {
  try {
    const now = new Date();
    const defaultBotMessage = {
      sender_type: 'system',
      sender_name: 'Somame Support',
      message: 'Hey! How can we help?',
      created_at: now.toISOString(),
      formatted_time: formatChatTime(now),
      formatted_date: formatChatDate(now)
    };

    res.status(200).json({
      status: 'success',
      message: 'General chat context initialized',
      data: {
        title: 'Somame Support',
        subject: 'Something else',
        default_bot_message: defaultBotMessage
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's support cases with open/closed filter (Screen 102)
// @route   GET /api/support/cases
const getUserSupportCases = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // 'open', 'closed', or undefined/all

    const cases = await SupportCase.findByUserId(userId, { status });
    const counts = await SupportCase.getCountsByUserId(userId);

    const formatted = cases.map(c => ({
      ...c,
      display_case_number: `Case ${c.case_number}`,
      formatted_time: formatChatTime(c.last_message_at),
      formatted_date: formatChatDate(c.last_message_at)
    }));

    res.status(200).json({
      status: 'success',
      message: 'Cases retrieved successfully',
      filter: status || 'all',
      counts,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close a support case
// @route   PATCH /api/support/cases/:id/close
const closeCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    const supportCase = await SupportCase.findByIdOrCaseNumber(caseId);
    if (!supportCase) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }

    if (role === 'customer' && supportCase.user_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const updatedCase = await SupportCase.updateStatus(supportCase.id, 'closed');

    res.status(200).json({
      status: 'success',
      message: 'Case closed successfully',
      data: {
        ...updatedCase,
        display_case_number: `Case ${updatedCase.case_number}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a specific case details and full message history
// @route   GET /api/support/cases/:id
const getCaseDetails = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    // Support lookup by primary ID or 10-digit case_number string
    const supportCase = await SupportCase.findByIdOrCaseNumber(caseId);

    if (!supportCase) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }

    // Customer can only view their own cases
    if (role === 'customer' && supportCase.user_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    // Automatically mark incoming messages from other sender as read
    await SupportMessage.markAsRead(supportCase.id, userId);

    const messages = await SupportMessage.findByCaseId(supportCase.id);
    const formattedMessages = messages.map(m => ({
      ...m,
      formatted_time: formatChatTime(m.created_at),
      formatted_date: formatChatDate(m.created_at)
    }));

    res.status(200).json({
      status: 'success',
      message: 'Case details retrieved successfully',
      data: {
        ...supportCase,
        display_case_number: `Case ${supportCase.case_number}`,
        messages: formattedMessages
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all messages in a support case as read
// @route   PATCH /api/support/cases/:id/read
const markCaseMessagesAsRead = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;

    const supportCase = await SupportCase.findByIdOrCaseNumber(caseId);
    if (!supportCase) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }

    const markedCount = await SupportMessage.markAsRead(supportCase.id, userId);

    const io = req.app.get('io');
    if (io && markedCount > 0) {
      io.to(`support_case_${supportCase.id}`).emit('messages_marked_read', {
        case_id: supportCase.id,
        read_by: userId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read',
      marked_count: markedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in an existing support case
// @route   POST /api/support/cases/:id/messages
const sendCaseMessage = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;
    const { message, attachments } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Message text is required' });
    }

    const supportCase = await SupportCase.findByIdOrCaseNumber(caseId);

    if (!supportCase) {
      return res.status(404).json({ status: 'error', message: 'Support case not found' });
    }

    if (role === 'customer' && supportCase.user_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    const senderType = role === 'admin' ? 'agent' : 'customer';

    const newMessage = await SupportMessage.create({
      case_id: supportCase.id,
      sender_id: userId,
      sender_type: senderType,
      message,
      attachments: attachments || []
    });

    // Update case last message and timestamp
    await SupportCase.updateLastMessage(supportCase.id, message);

    const formattedMessage = {
      ...newMessage,
      formatted_time: formatChatTime(newMessage.created_at),
      formatted_date: formatChatDate(newMessage.created_at)
    };

    // Emit real-time Socket.io event to room
    const io = req.app.get('io');
    if (io) {
      io.to(`support_case_${supportCase.id}`).emit('support_message_received', formattedMessage);
      io.to(`user_${supportCase.user_id}`).emit('support_case_updated', {
        case_id: supportCase.id,
        case_number: supportCase.case_number,
        last_message: message,
        last_message_at: newMessage.created_at
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: formattedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get support articles / FAQs
// @route   GET /api/support/articles
const getSupportArticles = async (req, res, next) => {
  try {
    const { category } = req.query;
    let articles;
    if (category) {
      articles = await SupportArticle.findByCategory(category);
    } else {
      articles = await SupportArticle.findAll();
    }

    const categories = await SupportArticle.getCategories();

    res.status(200).json({
      status: 'success',
      message: 'Support articles retrieved successfully',
      categories,
      data: articles
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
