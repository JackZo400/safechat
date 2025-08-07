const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'retracted'],
    default: 'sent'
  },
  sessionKey: {
    iv: [Number],
    ciphertext: [Number]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 文本消息内容验证
messageSchema.path('content').validate(function(value) {
  if (this.type === 'text') {
    return typeof value === 'string' && value.length > 0 && value.length <= 2000;
  }
  return true;
}, 'Invalid text message content');

// 文件消息内容验证
messageSchema.path('content').validate(function(value) {
  if (this.type === 'file') {
    return (
      value && 
      typeof value === 'object' &&
      typeof value.filename === 'string' &&
      typeof value.type === 'string' &&
      typeof value.size === 'number' &&
      Array.isArray(value.iv) &&
      Array.isArray(value.ciphertext)
    );
  }
  return true;
}, 'Invalid file message content');

module.exports = mongoose.model('Message', messageSchema);