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

const PatientNotifications = ({ user, onStartChat, onNotificationCountChange, showToasts = true }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Track notification counts for appointments
  const [appointmentNotificationCounts, setAppointmentNotificationCounts] = useState({
    confirmed: 0,
    rejected: 0
  });

  useEffect(() => {
    if (!user) return;
    
    const patientId = user.id || user._id;
    console.log('PatientNotifications user data:', user);
    console.log('Patient ID extracted:', patientId);
    
    if (!patientId) {
      console.warn('No patient ID found, skipping socket connection');
      return;
    }

    // Connect to Socket.IO server
    socketRef.current = io(SOCKET_URL, { 
      transports: ["websocket", "polling"], 
      withCredentials: true 
    });

    socketRef.current.on("connect", () => {
      console.log("Patient connected to socket:", socketRef.current.id);
      setConnected(true);
      
      // Join as patient
      socketRef.current.emit("joinRoom", {
        roomId: `patient_${patientId}`,
        user: {
          id: patientId,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          profilePicture: user.profilePicture
        },
        userType: "patient"
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Patient disconnected from socket");
      setConnected(false);
    });

    // Listen for doctor messages (similar to how doctors listen for patient messages)
    socketRef.current.on("newDoctorMessage", (data) => {
      console.log("Doctor message received:", data);
      
      const newNotification = {
        id: `${Date.now()}_${Math.random()}`,
        type: "message",
        doctorName: data.doctorName,
        doctorId: data.doctorId,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
        roomId: data.roomId,
        senderType: data.senderType
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast notification only if showToasts is true
      if (showToasts) {
        toast.info(`New message from Dr. ${data.doctorName}`, {
          description: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
          action: {
            label: "View",
            onClick: () => handleJoinChat(newNotification)
          }
        });
      }
    });

    // Listen for doctor joining notifications
    socketRef.current.on("doctorJoined", (data) => {
      console.log("Doctor joined notification:", data);
      
      const newNotification = {
        id: `${Date.now()}_${Math.random()}`,
        type: "doctorJoined",
        doctorName: data.doctorName,
        message: `Dr. ${data.doctorName} is now available for chat`,
        timestamp: new Date(data.timestamp),
        read: false,
        roomId: data.roomId
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      if (showToasts) {
        toast.success(`Dr. ${data.doctorName} joined the chat`);
      }
    });

    // Listen for appointment confirmations
    socketRef.current.on(`appointment-confirmed-${patientId}`, (data) => {
      console.log("Appointment confirmed:", data);
      
      const newNotification = {
        id: `${Date.now()}_${Math.random()}`,
        type: "appointmentConfirmed",
        doctorName: data.doctorName,
        message: data.message,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Increment confirmed notification count
      setAppointmentNotificationCounts(prev => ({
        ...prev,
        confirmed: prev.confirmed + 1
      }));
      
      if (showToasts) {
        toast.success(`Appointment Confirmed!`, {
          description: `${data.doctorName} has confirmed your appointment`,
          duration: 5000
        });
      }
    });

    // Listen for appointment rejections
    socketRef.current.on(`appointment-rejected-${patientId}`, (data) => {
      console.log("Appointment rejected:", data);
      
      const newNotification = {
        id: `${Date.now()}_${Math.random()}`,
        type: "appointmentRejected",
        doctorName: data.doctorName,
        message: data.message,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Increment rejected notification count
      setAppointmentNotificationCounts(prev => ({
        ...prev,
        rejected: prev.rejected + 1
      }));
      
      if (showToasts) {
        toast.error(`Appointment Declined`, {
          description: `${data.doctorName} has declined your appointment request`,
          duration: 5000
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const handleJoinChat = (notification) => {
    markAsRead(notification.id);
    
    // Extract doctor ID from room ID or notification data
    const roomParts = notification.roomId.split('_');
    if (roomParts.length === 3) {
      const patientId = roomParts[1];
      const doctorId = roomParts[2];
      
      const doctor = {
        id: doctorId,
        fullName: notification.doctorName,
        _id: doctorId
      };
      
      // Navigate to live chat page with doctor and patient context
      navigate("/live-chat", { 
        state: { 
          selectedDoctor: doctor,
          patientProfile: user,
          activeChatDoctor: doctor,
          activeChatRoom: notification.roomId,
          userType: 'patient'
        } 
      });
      
      if (showToasts) {
        toast.success(`Opening chat with Dr. ${notification.doctorName}`);
      }
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

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Emit notification count changes to parent component
  useEffect(() => {
    if (onNotificationCountChange) {
      onNotificationCountChange(unreadCount);
    }
  }, [unreadCount, onNotificationCountChange]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Doctor Notifications</h3>
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
                  Doctor messages and chat requests will appear here.
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
                transition={{ duration: 0.2 }}
              >
                <Card className={`${notification.read ? 'bg-gray-50' : 
                  notification.type === 'appointmentConfirmed' ? 'bg-green-50 border-green-200' :
                  notification.type === 'appointmentRejected' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={notification.profilePicture} 
                          alt={notification.doctorName} 
                        />
                        <AvatarFallback className={
                          notification.type === 'appointmentConfirmed' ? 'bg-green-500 text-white' :
                          notification.type === 'appointmentRejected' ? 'bg-red-500 text-white' :
                          'bg-blue-500 text-white'
                        }>
                          {notification.doctorName?.charAt(0) || 'D'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.type === 'appointmentConfirmed' ? '✓ ' : 
                             notification.type === 'appointmentRejected' ? '✗ ' : ''}
                            Dr. {notification.doctorName}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {notification.timestamp.toLocaleTimeString()}
                            </span>
                            {!notification.read && (
                              <div className={`h-2 w-2 rounded-full ${
                                notification.type === 'appointmentConfirmed' ? 'bg-green-500' :
                                notification.type === 'appointmentRejected' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`} />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearNotification(notification.id)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Show appointment details for appointment notifications */}
                        {(notification.type === 'appointmentConfirmed' || notification.type === 'appointmentRejected') && (
                          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                            <div>📅 {new Date(notification.appointmentDate).toLocaleDateString()}</div>
                            <div>🕐 {notification.startTime}</div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-3 mt-3">
                          {notification.type === 'message' || notification.type === 'doctorJoined' ? (
                            <Button
                              size="sm"
                              onClick={() => handleJoinChat(notification)}
                              className="text-xs"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          ) : notification.type === 'appointmentRejected' ? (
                            <Button
                              size="sm"
                              onClick={() => navigate('/patient-dashboard', { state: { activeTab: 'appointments' } })}
                              className="text-xs bg-blue-500 hover:bg-blue-600"
                            >
                              Book New Appointment
                            </Button>
                          ) : null}
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Messages</p>
                  <p className="text-xs text-gray-600">{notifications.length} received</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Unread</p>
                  <p className="text-xs text-gray-600">{unreadCount} pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientNotifications;
