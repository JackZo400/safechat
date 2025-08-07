require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const socketService = require('./services/socket');
const connectDB = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// 安全中间件
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));

// 请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200 // 每个IP最多200次请求
});
app.use(limiter);

// 连接数据库
connectDB();

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// 错误处理
app.use(errorHandler);

// Socket.IO 配置
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2分钟
    skipMiddlewares: true
  }
});

// Socket.IO 事件处理
io.on('connection', (socket) => {
  socketService.handleConnection(socket, io);
  
  socket.on('disconnect', () => {
    socketService.handleDisconnect(socket);
  });
  
  socket.on('message', (data) => {
    socketService.handleMessage(socket, data);
  });
  
  socket.on('message_retract', (data) => {
    socketService.handleMessageRetraction(socket, data);
  });
  
  socket.on('typing', (data) => {
    socketService.handleTyping(socket, data);
  });
  
  socket.on('read_receipt', (data) => {
    socketService.handleReadReceipt(socket, data);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});