import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Circle, MessageCircle, RefreshCw, Check, CheckCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LiveChat({ roomId, user, userType = "patient", targetUser = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false); // Changed to false initially
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [targetUserOnline, setTargetUserOnline] = useState(false);
  const [targetUserLastSeen, setTargetUserLastSeen] = useState(null);
  const [messageStatuses, setMessageStatuses] = useState(new Map());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // const { markRoomAsActive, markRoomAsInactive } = useChatNotifications();

  // Load chat history from database
  const loadChatHistory = async () => {
    // Always allow manual retry
    if (!user?.id) {
      console.log('No user ID available for chat history');
      setLoadingHistory(false);
      return;
    }
    
    try {
      setLoadingHistory(true);
      console.log('Starting chat history load...');
      
      // If no target user, just set loading to false and continue
      if (!targetUser?.id && !targetUser?._id) {
        console.log('No target user available, skipping history load');
        setLoadingHistory(false);
        setHistoryLoaded(true);
        return;
      }
      
      let doctorId, patientId;
      
      if (userType === 'doctor') {
        doctorId = user.id;
        patientId = targetUser.id || targetUser._id;
      } else {
        patientId = user.id;
        doctorId = targetUser.id || targetUser._id;
      }

      console.log(`Loading history for doctor: ${doctorId}, patient: ${patientId}`);

      const response = await axios.get(
        `${API_URL}/api/chat/doctor/${doctorId}/patient/${patientId}/history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success && response.data.data.messages) {
        const chatHistory = response.data.data.messages.map(msg => ({
          message: msg.content,
          sender: {
            id: msg.senderId._id || msg.senderId,
            name: msg.senderId.firstName ? 
              `${msg.senderId.firstName} ${msg.senderId.lastName}` : 
              (msg.senderModel === 'Doctor' ? 'Doctor' : 'Patient'),
            profilePicture: msg.senderId.profilePicture
          },
          senderType: msg.senderModel === 'Doctor' ? 'doctor' : 'patient',
          timestamp: msg.createdAt,
          _id: msg._id,
          messageStatus: msg.messageStatus || 'sent'
        }));
        
        setMessages(chatHistory);
        setHistoryLoaded(true);
        console.log(`Loaded ${chatHistory.length} messages from history`);
      } else {
        console.log('No chat history found or empty response');
        setMessages([]);
        setHistoryLoaded(true);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Don't block the chat if history loading fails
      setMessages([]);
      setHistoryLoaded(true);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    console.log('LiveChat component mounted with:', { user, targetUser, userType, roomId });
    
    // Load chat history first
    loadChatHistory();

    // Connect to Socket.IO server
    socketRef.current = io(SOCKET_URL, { 
      transports: ["websocket", "polling"], 
      withCredentials: true 
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
      setConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from chat server");
      setConnected(false);
    });

    // Join the chat room
    if (roomId) {
      socketRef.current.emit("joinRoom", {
        roomId,
        user,
        userType
      });
      // markRoomAsActive(roomId);
      console.log(`Joining room: ${roomId} as ${userType}`);
    }

    // Listen for incoming messages (only add new real-time messages)
    socketRef.current.on("chatMessage", (msg) => {
      console.log("Received real-time message:", msg);
      // Only add the message if it's not already in our messages array
      setMessages((prev) => {
        const isDuplicate = prev.some(existingMsg => 
          existingMsg._id === msg._id || 
          (existingMsg.timestamp === msg.timestamp && 
           existingMsg.sender?.id === msg.sender?.id && 
           existingMsg.message === msg.message)
        );
        
        if (!isDuplicate) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    // Listen for user joined notifications
    socketRef.current.on("userJoined", (notification) => {
      console.log(notification);
      setOnlineUsers(prev => prev + 1);
    });

    // Listen for typing indicators
    socketRef.current.on("userTyping", (data) => {
      if (data.sender !== user?.name) {
        setTypingUser(data.isTyping ? data.sender : "");
      }
    });

    // Listen for online status updates
    socketRef.current.on("userOnlineStatus", (data) => {
      const { userId, userType: statusUserType, isOnline, lastSeen } = data;
      if (userId === targetUser?.id || userId === targetUser?._id) {
        setTargetUserOnline(isOnline);
        setTargetUserLastSeen(lastSeen);
      }
    });

    // Listen for message status updates
    socketRef.current.on("messageStatusUpdate", (data) => {
      const { messageId, status, timestamp } = data;
      setMessageStatuses(prev => {
        const updated = new Map(prev);
        updated.set(messageId, { status, timestamp });
        return updated;
      });
      
      // Update message in messages array
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, messageStatus: status } : msg
      ));
    });

    return () => {
      // if (roomId) {
      //   markRoomAsInactive(roomId);
      // }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, user?.name, user?.id, targetUser?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end",
        inline: "nearest"
      });
    }
  }, [messages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (scrollContainer && messages.length > 0) {
      const isScrolledToBottom = 
        scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight - 100;
      
      if (isScrolledToBottom) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!input.trim() || !connected) return;

    const messageData = {
      roomId,
      message: input.trim(),
      sender: {
        name: user?.name || "Anonymous",
        id: user?.id,
        profilePicture: user?.profilePicture
      },
      senderType: userType,
      targetUserId: targetUser?._id || targetUser?.id,
      messageStatus: 'sent'
    };

    console.log('Sending message with data:', messageData);
    socketRef.current.emit("chatMessage", messageData);
    setInput("");
    
    // Clear typing indicator
    clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("typing", {
      roomId,
      sender: user?.name || "Anonymous",
      isTyping: false
    });
  };

  // Mark message as read when it comes into view
  const markMessageAsRead = (messageId) => {
    if (messageId && socketRef.current) {
      socketRef.current.emit("markAsRead", {
        messageId,
        roomId,
        userId: user?.id,
        userType
      });
    }
  };

  // Mark incoming messages as read when they appear
  useEffect(() => {
    messages.forEach(msg => {
      const isFromOtherUser = msg.sender?.id !== user?.id;
      const isUnread = !msg.isRead && msg.messageStatus !== 'read';
      
      if (isFromOtherUser && isUnread && msg._id) {
        markMessageAsRead(msg._id);
      }
    });
  }, [messages, user?.id]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", {
        roomId,
        sender: user?.name || "Anonymous",
        isTyping: true
      });
    }

    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit("typing", {
        roomId,
        sender: user?.name || "Anonymous",
        isTyping: false
      });
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return lastSeenDate.toLocaleDateString();
  };

  const renderMessageStatus = (message, isOwn) => {
    if (!isOwn) return null;
    
    const status = message.messageStatus || messageStatuses.get(message._id)?.status || 'sent';
    
    switch (status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50 bg-primary/5 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-xl font-semibold">
              Live Chat with {userType === "patient" ? "Doctor" : "Patient"}
            </CardTitle>
            {targetUser && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Circle 
                  className={`h-2 w-2 ${targetUserOnline ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"}`} 
                />
                <span>
                  {targetUserOnline ? 'Online' : `Last seen ${formatLastSeen(targetUserLastSeen)}`}
                </span>
              </div>
            )}
          </div>
          {loadingHistory && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Circle 
            className={`h-3 w-3 ${connected ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"}`} 
          />
          <span>{connected ? "Connected" : "Connecting..."}</span>
          {historyLoaded && (
            <span className="text-xs text-green-600">• History loaded</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {/* Messages Area with Fixed Height and Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-muted/10 to-muted/20 min-h-0 max-h-[400px]">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading chat history...</span>
              </div>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const senderName = typeof msg.sender === 'string' ? msg.sender : msg.sender?.name || 'Unknown';
                    const isOwn = senderName === user?.name || msg.sender?.id === user?.id;
                    const isDoctor = msg.senderType === "doctor";
                    
                    return (
                      <motion.div
                        key={msg._id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[75%] ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                      {!isOwn && (
                        <Avatar className="h-7 w-7 mb-1 flex-shrink-0">
                          <AvatarImage src={msg.sender?.profilePicture || ""} alt={senderName} />
                          <AvatarFallback className={`text-xs ${isDoctor ? "bg-blue-500 text-white" : "bg-green-500 text-white"}`}>
                            {senderName?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`relative rounded-2xl px-3 py-2 shadow-sm max-w-full ${
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : isDoctor 
                            ? "bg-blue-500 text-white rounded-bl-md" 
                            : "bg-background border border-border rounded-bl-md"
                      }`}>
                        {!isOwn && (
                          <div className="text-xs font-medium mb-1 opacity-80">
                            {isDoctor ? "Dr. " : ""}{senderName}
                          </div>
                        )}
                        <div className="text-sm break-words leading-relaxed">
                          {msg.message}
                        </div>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <div className="text-xs opacity-70">
                            {formatTime(msg.timestamp)}
                          </div>
                          {renderMessageStatus(msg, isOwn)}
                        </div>
                      </div>
                      {isOwn && (
                        <Avatar className="h-7 w-7 mb-1 flex-shrink-0">
                          <AvatarImage src={user?.profilePicture || ""} alt={user?.name} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
              )}

          {/* Typing Indicator */}
          {typingUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2 bg-muted rounded-2xl px-4 py-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {typingUser[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </motion.div>
          )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-border/50 p-4 bg-background flex-shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                className="w-full border border-border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm resize-none"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={connected ? "Type your message..." : "Connecting..."}
                disabled={!connected}
              />
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || !connected}
              size="icon"
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {!connected && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Connecting to chat server...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}