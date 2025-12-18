import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, MessageCircle, Users, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DoctorNotifications = ({ user, onStartChat, onNotificationCountChange, showToasts = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const doctorId = user.id || user._id;
    console.log('DoctorNotifications user data:', user);
    console.log('Doctor ID extracted:', doctorId);
    
    if (!doctorId) {
      console.warn('No doctor ID found, skipping socket connection');
      return;
    }

    // Connect to Socket.IO server
    socketRef.current = io(SOCKET_URL, { 
      transports: ["websocket", "polling"], 
      withCredentials: true 
    });

    socketRef.current.on("connect", () => {
      console.log("Doctor connected to socket:", socketRef.current.id);
      setConnected(true);
      
      // Join as doctor
      socketRef.current.emit("joinRoom", {
        roomId: `doctor_${doctorId}`,
        user: {
          id: doctorId,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          profilePicture: user.profilePicture
        },
        userType: "doctor"
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Doctor disconnected from socket");
      setConnected(false);
    });

    // Listen for patient joining notifications
    socketRef.current.on("patientJoined", (data) => {
      console.log("Patient joined notification:", data);
      const newNotification = {
        id: Date.now(),
        type: "patientJoined",
        patientName: data.patientName,
        roomId: data.roomId,
        timestamp: new Date(data.timestamp),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      if (showToasts) {
        toast.info(`${data.patientName} wants to chat with you`, {
          description: "Click to start conversation",
          action: {
            label: "Start Chat",
            onClick: () => {
              if (onStartChat) {
                onStartChat({ 
                  id: data.patientId, 
                  fullName: data.patientName,
                  name: data.patientName 
                }, data.roomId);
              }
            }
          }
        });
      }
    });

    // Listen for new patient messages
    socketRef.current.on("newPatientMessage", (data) => {
      console.log("New patient message notification:", data);
      const newNotification = {
        id: Date.now(),
        type: "newMessage",
        patientName: data.patientName,
        patientId: data.patientId,
        message: data.message,
        roomId: data.roomId,
        timestamp: new Date(data.timestamp),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      if (showToasts) {
        toast.info(`New message from ${data.patientName}`, {
          description: data.message.length > 60 ? data.message.substring(0, 60) + '...' : data.message,
          action: {
            label: "View Chat",
            onClick: () => {
              if (onStartChat) {
                onStartChat({ 
                  id: data.patientId, 
                  fullName: data.patientName,
                  name: data.patientName 
                }, data.roomId);
              }
            }
          }
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const handleJoinChat = (notification) => {
    markAsRead(notification.id);
    
    // Extract patient ID from room ID (format: chat_patientId_doctorId)
    const roomParts = notification.roomId.split('_');
    if (roomParts.length === 3) {
      const patientId = roomParts[1];
      const doctorId = roomParts[2];
      
      const patient = {
        id: patientId,
        fullName: notification.patientName,
        _id: patientId
      };
      
      // Navigate to live chat page with patient and doctor context
      navigate("/live-chat", { 
        state: { 
          selectedPatient: patient,
          doctorProfile: user,
          activeChatPatient: patient,
          activeChatRoom: notification.roomId,
          userType: 'doctor'
        } 
      });
      
      toast.success(`Opening chat with ${notification.patientName}`);
    }
  };

  const clearNotification = (notificationId) => {
    console.log('Clearing notification:', notificationId);
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      console.log('Notifications after clearing:', updated.length);
      return updated;
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  console.log('Current unread count:', unreadCount, 'Total notifications:', notifications.length);

  // Emit notification count changes to parent component
  useEffect(() => {
    if (onNotificationCountChange) {
      console.log('Updating parent with count:', unreadCount);
      onNotificationCountChange(unreadCount);
    }
  }, [unreadCount, onNotificationCountChange]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Patient Notifications</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Online' : 'Offline'}
          </span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No notifications</h4>
                <p className="text-gray-500">
                  Patient messages and chat requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {notification.patientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {notification.patientName}
                            </h4>
                            {notification.type === 'newMessage' && (
                              <MessageCircle className="h-4 w-4 text-blue-500" />
                            )}
                            {notification.type === 'patientJoined' && (
                              <Users className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.type === 'newMessage' 
                              ? `New message: ${notification.message}`
                              : 'Wants to start a chat'
                            }
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {notification.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleJoinChat(notification)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearNotification(notification.id)}
                          className="text-gray-500 hover:text-red-500 hover:bg-red-50 border-gray-200"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DoctorNotifications;