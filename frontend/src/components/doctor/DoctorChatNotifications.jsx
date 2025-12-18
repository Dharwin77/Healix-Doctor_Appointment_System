import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  FaBell, 
  FaComments, 
  FaUser, 
  FaClock, 
  FaEnvelope,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DoctorChatNotifications = ({ doctorProfile, onStartChat }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!doctorProfile?.id) return;

    // Initialize socket connection
    const socketConnection = io(SOCKET_URL, { 
      transports: ["websocket", "polling"], 
      withCredentials: true 
    });

    socketConnection.on('connect', () => {
      console.log('Doctor connected to notification service');
      
      // Join doctor-specific room for notifications
      socketConnection.emit('joinRoom', {
        roomId: `doctor_${doctorProfile.id}`,
        user: {
          name: doctorProfile.fullName,
          id: doctorProfile.id,
          profilePicture: doctorProfile.profilePicture
        },
        userType: 'doctor'
      });
    });

    // Listen for new patient messages
    socketConnection.on('newPatientMessage', (messageData) => {
      console.log('New patient message notification:', messageData);
      
      const notification = {
        id: Date.now(),
        type: 'message',
        patientName: messageData.patientName,
        patientId: messageData.patientId,
        message: messageData.message,
        roomId: messageData.roomId,
        timestamp: new Date(messageData.timestamp),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.info(`New message from ${messageData.patientName}`, {
        description: messageData.message,
        action: {
          label: "View",
          onClick: () => handleNotificationClick(notification)
        }
      });
    });

    // Listen for patient joining notifications
    socketConnection.on('patientJoined', (data) => {
      console.log('Patient joined notification:', data);
      
      const notification = {
        id: Date.now(),
        type: 'join',
        patientName: data.patientName,
        roomId: data.roomId,
        timestamp: new Date(data.timestamp),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      toast.info(`${data.patientName} wants to chat`, {
        action: {
          label: "Start Chat",
          onClick: () => handleNotificationClick(notification)
        }
      });
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [doctorProfile?.id]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Extract patient ID from room ID (format: chat_patientId_doctorId)
    const roomParts = notification.roomId.split('_');
    const patientId = roomParts[1];

    // Create patient object for chat
    const patient = {
      _id: patientId,
      id: patientId,
      fullName: notification.patientName,
      name: notification.patientName
    };

    if (onStartChat) {
      onStartChat(patient, notification.roomId);
    }
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <FaBell className="text-blue-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Messages</h2>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-sm"
          >
            <FaCheck className="mr-2 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FaComments className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">
                  Patient messages and chat requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.read ? 'border-blue-200 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {notification.patientName?.[0]?.toUpperCase() || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {notification.patientName}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <FaTimes className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          {notification.type === 'message' ? (
                            <FaEnvelope className="h-3 w-3 text-blue-500" />
                          ) : (
                            <FaUser className="h-3 w-3 text-green-500" />
                          )}
                          <p className="text-sm text-gray-600 truncate">
                            {notification.type === 'message' 
                              ? notification.message 
                              : 'Wants to start a chat'
                            }
                          </p>
                        </div>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FaClock className="text-amber-600 mt-1" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">How it works</h4>
              <p className="text-sm text-amber-700">
                When patients search for you and start a chat, you'll receive notifications here. 
                Click on any notification to start chatting with that patient.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorChatNotifications;