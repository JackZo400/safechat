const Message = require('../models/Message');
const Session = require('../models/Session');
const User = require('../models/User');
const { emitToUser } = require('./socketUtils');

// 在线用户映射 { userId: socketId }
const onlineUsers = {};

// 处理新连接
const handleConnection = (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // 用户认证
  socket.on('authenticate', async (token) => {
    try {
      const user = await verifyToken(token); // 实现JWT验证
      if (!user) return socket.disconnect();
      
      // 存储用户ID和socketID的映射
      onlineUsers[user.id] = socket.id;
      socket.userId = user.id;
      
      // 更新用户在线状态
      await User.findByIdAndUpdate(user.id, { online: true, lastSeen: new Date() });
      
      // 通知联系人用户已上线
      user.contacts.forEach(contactId => {
        emitToUser(contactId, 'user_status', { 
          userId: user.id, 
          online: true 
        });
      });
      
      // 发送离线消息
      const offlineMessages = await Message.find({
        receiver: user.id,
        status: 'sent'
      }).sort({ createdAt: 1 });
      
      offlineMessages.forEach(msg => {
        socket.emit('message', {
          id: msg._id,
          sender: msg.sender,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
          sessionKey: msg.sessionKey
        });
        
        // 更新消息状态为已送达
        msg.status = 'delivered';
        msg.save();
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.disconnect();
    }
  });
};

// 处理断开连接
const handleDisconnect = (socket) => {
  if (socket.userId) {
    delete onlineUsers[socket.userId];
    
    // 更新用户在线状态
    User.findByIdAndUpdate(socket.userId, { 
      online: false, 
      lastSeen: new Date() 
    }).then(user => {
      // 通知联系人用户已离线
      user.contacts.forEach(contactId => {
        emitToUser(contactId, 'user_status', { 
          userId: user.id, 
          online: false 
        });
      });
    });
  }
};

// 处理新消息
const handleMessage = async (socket, data) => {
  const { receiverId, content, type, sessionKey } = data;
  const senderId = socket.userId;
  
  if (!senderId || !receiverId) return;
  
  try {
    // 创建新消息
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      type,
      sessionKey
    });
    
    await message.save();
    
    // 尝试直接发送给接收者
    const isDelivered = emitToUser(receiverId, 'message', {
      id: message._id,
      sender: senderId,
      content,
      type,
      createdAt: message.createdAt,
      sessionKey
    });
    
    // 更新消息状态
    message.status = isDelivered ? 'delivered' : 'sent';
    await message.save();
    
    // 发送送达回执（如果已送达）
    if (isDelivered) {
      socket.emit('message_status', {
        messageId: message._id,
        status: 'delivered'
      });
    }
    
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

// 处理消息撤回
const handleMessageRetraction = async (socket, data) => {
  const { messageId } = data;
  const userId = socket.userId;
  
  try {
    const message = await Message.findById(messageId);
    
    if (!message || message.sender.toString() !== userId) {
      return;
    }
    
    // 更新消息状态为已撤回
    message.status = 'retracted';
    await message.save();
    
    // 通知发送方
    socket.emit('message_status', {
      messageId: message._id,
      status: 'retracted'
    });
    
    // 通知接收方
    emitToUser(message.receiver.toString(), 'message_retract', {
      messageId: message._id
    });
    
  } catch (error) {
    console.error('Error retracting message:', error);
  }
};

// 处理已读回执
const handleReadReceipt = async (socket, data) => {
  const { messageId } = data;
  const userId = socket.userId;
  
  try {
    const message = await Message.findById(messageId);
    
    if (!message || message.receiver.toString() !== userId) {
      return;
    }
    
    // 更新消息状态为已读
    if (message.status !== 'read') {
      message.status = 'read';
      await message.save();
      
      // 通知发送方
      emitToUser(message.sender.toString(), 'message_status', {
        messageId: message._id,
        status: 'read'
      });
    }
    
  } catch (error) {
    console.error('Error handling read receipt:', error);
  }
};

module.exports = {
  handleConnection,
  handleDisconnect,
  handleMessage,
  handleMessageRetraction,
  handleReadReceipt
};