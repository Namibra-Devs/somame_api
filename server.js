require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const socketManager = require('./sockets/socketManager');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust to specific domains in production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to PostgreSQL database
connectDB();

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup API Routes
app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// Setup Socket.io event management
socketManager(io);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
