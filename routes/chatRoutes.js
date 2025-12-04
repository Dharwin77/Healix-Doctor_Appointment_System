const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get or create chat between doctor and patient
router.get('/doctor/:doctorId/patient/:patientId', chatController.getOrCreateChat);

// Get chat history with pagination
router.get('/doctor/:doctorId/patient/:patientId/history', chatController.getChatHistory);

// Save a new message
router.post('/doctor/:doctorId/patient/:patientId/message', chatController.saveMessage);

// Mark messages as read
router.put('/doctor/:doctorId/patient/:patientId/read', chatController.markAsRead);

// Get all chats for a doctor
router.get('/doctor/:doctorId/chats', chatController.getDoctorChats);

// Get all chats for a patient  
router.get('/patient/:patientId/chats', chatController.getPatientChats);

module.exports = router;