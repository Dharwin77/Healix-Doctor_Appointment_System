const Chat = require('../models/chat');
const Doctor = require('../models/doctor');
const Patient = require('../models/patient');

// Get or create chat between doctor and patient
const getOrCreateChat = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    // Find existing chat
    let chat = await Chat.findOne({ doctorId, patientId })
      .populate('doctorId', 'firstName lastName profilePicture')
      .populate('patientId', 'firstName lastName profilePicture')
      .populate('messages.senderId', 'firstName lastName profilePicture');

    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        doctorId,
        patientId,
        messages: []
      });
      await chat.save();
      
      // Populate after saving
      chat = await Chat.findById(chat._id)
        .populate('doctorId', 'firstName lastName profilePicture')
        .populate('patientId', 'firstName lastName profilePicture')
        .populate('messages.senderId', 'firstName lastName profilePicture');
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error getting/creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({ doctorId, patientId })
      .populate('doctorId', 'firstName lastName profilePicture')
      .populate('patientId', 'firstName lastName profilePicture')
      .populate('messages.senderId', 'firstName lastName profilePicture');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Get paginated messages (latest first)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = chat.messages
      .slice()
      .reverse()
      .slice(startIndex, endIndex)
      .reverse();

    res.status(200).json({
      success: true,
      data: {
        ...chat.toObject(),
        messages: paginatedMessages,
        totalMessages: chat.messages.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(chat.messages.length / limit),
        hasMore: endIndex < chat.messages.length
      }
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
};

// Save a new message
const saveMessage = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { content, senderModel, messageType = 'text' } = req.body;
    
    // Get sender ID based on user type
    let senderId;
    if (senderModel === 'Doctor') {
      senderId = doctorId;
    } else if (senderModel === 'Patient') {
      senderId = patientId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid sender model'
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({ doctorId, patientId });
    if (!chat) {
      chat = new Chat({ doctorId, patientId, messages: [] });
    }

    // Add message using the model method
    const messageData = {
      senderId,
      senderModel,
      content,
      messageType,
      isRead: false
    };

    const newMessage = chat.addMessage(messageData);
    await chat.save();

    // Populate the new message
    await chat.populate('messages.senderId', 'firstName lastName profilePicture');
    const populatedMessage = chat.messages.id(newMessage._id);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message',
      error: error.message
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;
    const { userModel } = req.body;
    
    let userId;
    if (userModel === 'Doctor') {
      userId = doctorId;
    } else if (userModel === 'Patient') {
      userId = patientId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user model'
      });
    }

    const chat = await Chat.findOne({ doctorId, patientId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const markedCount = chat.markAsRead(userId, userModel);
    await chat.save();

    res.status(200).json({
      success: true,
      data: {
        markedCount,
        doctorUnreadCount: chat.doctorUnreadCount,
        patientUnreadCount: chat.patientUnreadCount
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// Get all chats for a doctor
const getDoctorChats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({ doctorId })
      .populate('doctorId', 'firstName lastName profilePicture')
      .populate('patientId', 'firstName lastName profilePicture')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalChats = await Chat.countDocuments({ doctorId });

    res.status(200).json({
      success: true,
      data: chats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalChats / limit),
      totalChats
    });
  } catch (error) {
    console.error('Error getting doctor chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor chats',
      error: error.message
    });
  }
};

// Get all chats for a patient
const getPatientChats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({ patientId })
      .populate('doctorId', 'firstName lastName profilePicture')
      .populate('patientId', 'firstName lastName profilePicture')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalChats = await Chat.countDocuments({ patientId });

    res.status(200).json({
      success: true,
      data: chats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalChats / limit),
      totalChats
    });
  } catch (error) {
    console.error('Error getting patient chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient chats',
      error: error.message
    });
  }
};

module.exports = {
  getOrCreateChat,
  getChatHistory,
  saveMessage,
  markAsRead,
  getDoctorChats,
  getPatientChats
};