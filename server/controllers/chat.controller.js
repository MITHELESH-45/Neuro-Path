const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');

const createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const session = await ChatSession.create({
      userId: req.user.id,
      title: title || 'New Autonomy Task'
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // ensure session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found or unauthorized' });

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createSession, getSessions, getMessages };
