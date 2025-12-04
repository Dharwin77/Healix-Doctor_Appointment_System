const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables first
dotenv.config({ path: __dirname + '/.env' });

const connectDB = require('./config/db.config.js');
const Chat = require('./models/chat');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes.js');
const patientRoutes = require('./routes/patientRoutes.js');
const appointmentRoutes = require('./routes/appointmentRoutes.js');
const doctorAvailabilityRoutes = require('./routes/doctorAvailabilityRoutes.js');
const therapyRoutes = require('./routes/therapyRoutes.js');
const chatbotRoutes=require('./routes/chatbotRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const PORT = process.env.PORT || 5000;

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "https://healix-git-main-dharwin-ss-projects.vercel.app",
      "https://healix-alpha.vercel.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://healix-med.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: [
    "https://healix-git-main-dharwin-ss-projects.vercel.app",
    "https://healix-alpha.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://healix-med.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());

// Make io available in routes
app.set('io', io);

//routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', doctorAvailabilityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/therapies', therapyRoutes);
app.use('/api/medical',chatbotRoutes );
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO chat functionality
const activeUsers = new Map(); // Track active users and their types

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room with user info
  socket.on('joinRoom', async (data) => {
    const { roomId, user, userType } = data;
    socket.join(roomId);
    
    // Store user information
    activeUsers.set(socket.id, {
      user,
      userType,
      roomId,
      socketId: socket.id
    });
    
    // Update online status in database
    try {
      // Extract doctor and patient IDs from room or user data
      let doctorId, patientId;
      
      if (userType === 'doctor') {
        doctorId = user.id;
        // Try to find patient ID from room format or active users
        const roomParts = roomId.split('_');
        if (roomParts.length >= 3) {
          patientId = roomParts[1];
        }
      } else {
        patientId = user.id;
        const roomParts = roomId.split('_');
        if (roomParts.length >= 3) {
          doctorId = roomParts[2];
        }
      }

      if (doctorId && patientId) {
        const updateData = {};
        updateData[`${userType}Online`] = true;
        updateData[`${userType}LastSeen`] = new Date();
        
        await Chat.findOneAndUpdate(
          { doctorId, patientId },
          updateData,
          { upsert: false }
        );
        
        // Notify room about user coming online
        socket.to(roomId).emit('userOnlineStatus', {
          userId: user.id,
          userType,
          isOnline: true,
          lastSeen: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
    
    console.log(`${userType} ${user.name} (${socket.id}) joined room ${roomId}`);
    socket.to(roomId).emit('userJoined', {
      message: `${user.name} joined the chat`,
      user,
      userType
    });

    // Notify doctors about new patient connections
    if (userType === 'patient') {
      // Extract doctor ID from room ID if format is chat_patientId_doctorId
      const roomParts = roomId.split('_');
      if (roomParts.length === 3 && roomParts[0] === 'chat') {
        const doctorId = roomParts[2];
        
        // Notify all doctor sockets about new patient message
        for (let [socketId, userData] of activeUsers.entries()) {
          if (userData.userType === 'doctor' && userData.user.id === doctorId) {
            io.to(socketId).emit('patientJoined', {
              patientName: user.name,
              roomId,
              timestamp: new Date()
            });
          }
        }
      }
    }
  });

  // Handle chat messages with enhanced notifications and database persistence
  socket.on('chatMessage', async (data) => {
    const { roomId, message, sender, senderType, targetUserId } = data;
    const messageData = {
      message,
      sender,
      senderType, // 'doctor' or 'patient'
      timestamp: new Date(),
      socketId: socket.id,
      targetUserId,
      messageStatus: 'sent'
    };
    
    // Save message to database
    let savedMessage = null;
    try {
      // Extract doctor and patient IDs from room format or data
      let doctorId, patientId;
      
      if (senderType === 'doctor') {
        doctorId = sender.id;
        patientId = targetUserId;
      } else {
        patientId = sender.id;
        doctorId = targetUserId;
      }

      if (doctorId && patientId) {
        // Find or create chat
        let chat = await Chat.findOne({ doctorId, patientId });
        if (!chat) {
          chat = new Chat({ doctorId, patientId, messages: [] });
        }

        // Add message to database
        const dbMessageData = {
          senderId: sender.id,
          senderModel: senderType === 'doctor' ? 'Doctor' : 'Patient',
          content: message,
          messageType: 'text',
          isRead: false,
          messageStatus: 'sent'
        };

        const newMessage = chat.addMessage(dbMessageData);
        await chat.save();
        
        savedMessage = newMessage;
        messageData._id = newMessage._id;
        console.log(`Message saved to database for room ${roomId}`);
      }
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
    
    // Broadcast message to all users in the room
    io.to(roomId).emit('chatMessage', messageData);
    console.log(`Message in room ${roomId}:`, messageData);

    // Update message status to delivered when other users receive it
    if (savedMessage) {
      setTimeout(async () => {
        try {
          const chat = await Chat.findOne({
            $or: [
              { doctorId: sender.id },
              { patientId: sender.id }
            ]
          });
          
          if (chat) {
            const message = chat.messages.id(savedMessage._id);
            if (message && message.messageStatus === 'sent') {
              message.messageStatus = 'delivered';
              message.isDelivered = true;
              message.deliveredAt = new Date();
              await chat.save();
              
              // Notify sender about delivery
              io.to(roomId).emit('messageStatusUpdate', {
                messageId: savedMessage._id,
                status: 'delivered',
                timestamp: new Date()
              });
            }
          }
        } catch (error) {
          console.error('Error updating message delivery status:', error);
        }
      }, 100); // Small delay to ensure message is delivered
    }
    io.to(roomId).emit('chatMessage', messageData);
    console.log(`Message in room ${roomId}:`, messageData);

    // Send notification to target user if they're not in the same room
    if (targetUserId) {
      if (senderType === 'patient') {
        console.log(`Looking for doctor with ID: ${targetUserId}`);
        // Notify the specific doctor about new patient message
        for (let [socketId, userData] of activeUsers.entries()) {
          console.log(`Checking user: ${userData.user.id} (type: ${userData.userType})`);
          if (userData.userType === 'doctor' && userData.user.id === targetUserId) {
            console.log(`Found target doctor, sending notification to socket: ${socketId}`);
            io.to(socketId).emit('newPatientMessage', {
              patientName: sender.name,
              patientId: sender.id,
              message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              roomId,
              timestamp: new Date(),
              senderType
            });
          }
        }
      } else if (senderType === 'doctor') {
        console.log(`Looking for patient with ID: ${targetUserId}`);
        // Notify the specific patient about new doctor message
        for (let [socketId, userData] of activeUsers.entries()) {
          console.log(`Checking user: ${userData.user.id} (type: ${userData.userType})`);
          if (userData.userType === 'patient' && userData.user.id === targetUserId) {
            console.log(`Found target patient, sending notification to socket: ${socketId}`);
            io.to(socketId).emit('newDoctorMessage', {
              doctorName: sender.name,
              doctorId: sender.id,
              message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              roomId,
              timestamp: new Date(),
              senderType
            });
          }
        }
      }
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('userTyping', {
      sender: data.sender,
      isTyping: data.isTyping
    });
  });

  // Handle message read receipts
  socket.on('markAsRead', async (data) => {
    const { messageId, roomId, userId, userType } = data;
    
    try {
      const chat = await Chat.findOne({
        $or: [
          { doctorId: userId },
          { patientId: userId }
        ]
      });
      
      if (chat) {
        const message = chat.messages.id(messageId);
        if (message && !message.isRead) {
          message.isRead = true;
          message.readAt = new Date();
          message.messageStatus = 'read';
          await chat.save();
          
          // Notify sender about read receipt
          io.to(roomId).emit('messageStatusUpdate', {
            messageId: messageId,
            status: 'read',
            timestamp: new Date(),
            readBy: userId
          });
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const userData = activeUsers.get(socket.id);
    if (userData) {
      // Update offline status in database
      try {
        const { user, userType, roomId } = userData;
        
        // Extract doctor and patient IDs
        let doctorId, patientId;
        if (userType === 'doctor') {
          doctorId = user.id;
          const roomParts = roomId.split('_');
          if (roomParts.length >= 3) {
            patientId = roomParts[1];
          }
        } else {
          patientId = user.id;
          const roomParts = roomId.split('_');
          if (roomParts.length >= 3) {
            doctorId = roomParts[2];
          }
        }

        if (doctorId && patientId) {
          const updateData = {};
          updateData[`${userType}Online`] = false;
          updateData[`${userType}LastSeen`] = new Date();
          
          await Chat.findOneAndUpdate(
            { doctorId, patientId },
            updateData,
            { upsert: false }
          );
          
          // Notify room about user going offline
          socket.to(roomId).emit('userOnlineStatus', {
            userId: user.id,
            userType,
            isOnline: false,
            lastSeen: new Date()
          });
        }
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
      
      socket.to(userData.roomId).emit('userLeft', {
        message: `${userData.user.name} left the chat`,
        user: userData.user,
        userType: userData.userType
      });
      activeUsers.delete(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

