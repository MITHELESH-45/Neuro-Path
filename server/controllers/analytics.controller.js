const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all sessions for the authenticated user
    const sessions = await ChatSession.find({ userId });
    const sessionIds = sessions.map(s => s._id);

    const activeSessionsCount = sessionIds.length;

    // Total runs = total number of user prompts sent
    const totalRuns = await Message.countDocuments({ 
      sessionId: { $in: sessionIds }, 
      sender: 'user' 
    });

    // Successful runs = total number of agent responses saved
    const successfulRuns = await Message.countDocuments({ 
      sessionId: { $in: sessionIds }, 
      sender: 'agent' 
    });

    const successRate = totalRuns === 0 ? 0 : Math.round((successfulRuns / totalRuns) * 100);

    // Fetch the 10 most recent agent extractions
    const recentAgentMessages = await Message.find({ 
      sessionId: { $in: sessionIds }, 
      sender: 'agent' 
    }).sort({ createdAt: -1 }).limit(10).lean();

    // Map each agent message to the user prompt that preceded it
    const recentExtractions = await Promise.all(recentAgentMessages.map(async (msg) => {
      const userMsg = await Message.findOne({
        sessionId: msg.sessionId,
        sender: 'user',
        createdAt: { $lte: msg.createdAt }
      }).sort({ createdAt: -1 });

      return {
        id: msg._id,
        date: msg.createdAt,
        task: userMsg ? userMsg.text : 'Unknown Task',
        data: msg.text
      };
    }));

    res.status(200).json({
      totalRuns,
      successRate,
      activeSessionsCount,
      recentExtractions
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnalytics };
