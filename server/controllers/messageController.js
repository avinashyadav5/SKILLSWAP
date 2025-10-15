const Message = require('../models/messageModel');

exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;
  const sent = await Message.findAll({ where: { senderId, receiverId } });
  const received = await Message.findAll({ where: { senderId: receiverId, receiverId: senderId } });
  const all = [...sent, ...received].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(all);
};

exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const msg = await Message.create({ senderId, receiverId, text });
  res.status(201).json(msg);
};
