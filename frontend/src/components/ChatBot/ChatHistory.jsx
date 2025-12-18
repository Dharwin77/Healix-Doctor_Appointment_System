import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Users, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ChatHistory = ({ user, userType = "patient" }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadChatHistory = async () => {
    if (!user?.id && !user?._id) {
      setError("User ID not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userId = user.id || user._id;
      const endpoint = userType === "doctor" 
        ? `/api/chat/doctor/${userId}/chats`
        : `/api/chat/patient/${userId}/chats`;

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setChats(response.data.data || []);
      } else {
        setError("Failed to load chat history");
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError("Failed to load chat history");
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [user, userType]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleChatClick = (chat) => {
    const otherUser = userType === "doctor" ? chat.patientId : chat.doctorId;
    const roomId = `chat_${chat.patientId._id || chat.patientId}_${chat.doctorId._id || chat.doctorId}`;
    
    navigate("/live-chat", {
      state: {
        selectedPatient: userType === "doctor" ? otherUser : null,
        selectedDoctor: userType === "patient" ? otherUser : null,
        doctorProfile: userType === "doctor" ? user : otherUser,
        activeChatPatient: userType === "doctor" ? otherUser : null,
        activeChatRoom: roomId,
        userType: userType
      }
    });
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return "No messages yet";
    return message.length > maxLength 
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chat History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading chat history...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chat History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadChatHistory}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span>Chat History</span>
          <Badge variant="secondary" className="ml-2">
            {chats.length}
          </Badge>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadChatHistory}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-4">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No conversations yet. Start chatting with{" "}
              {userType === "doctor" ? "patients" : "doctors"}!
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <AnimatePresence>
              {chats.map((chat, index) => {
                const otherUser = userType === "doctor" ? chat.patientId : chat.doctorId;
                const otherUserName = otherUser?.firstName 
                  ? `${otherUser.firstName} ${otherUser.lastName}`
                  : otherUser?.fullName || "Unknown User";
                
                const hasUnreadMessages = userType === "doctor" 
                  ? chat.doctorUnreadCount > 0
                  : chat.patientUnreadCount > 0;
                
                const unreadCount = userType === "doctor" 
                  ? chat.doctorUnreadCount
                  : chat.patientUnreadCount;

                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-b border-border/50 last:border-b-0"
                  >
                    <button
                      onClick={() => handleChatClick(chat)}
                      className="w-full p-4 hover:bg-muted/50 transition-colors duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={otherUser?.profilePicture || ""} 
                              alt={otherUserName} 
                            />
                            <AvatarFallback className={`
                              ${userType === "patient" ? "bg-blue-500" : "bg-green-500"} 
                              text-white text-sm font-semibold
                            `}>
                              {otherUserName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-medium truncate ${
                              hasUnreadMessages ? 'font-semibold' : ''
                            }`}>
                              {userType === "patient" ? "Dr. " : ""}{otherUserName}
                            </h3>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(chat.updatedAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              hasUnreadMessages 
                                ? 'text-foreground font-medium' 
                                : 'text-muted-foreground'
                            }`}>
                              {chat.lastMessage 
                                ? truncateMessage(chat.lastMessage.content)
                                : "No messages yet"
                              }
                            </p>
                            
                            <div className="flex items-center space-x-2">
                              {chat.messages?.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {chat.messages.length}
                                </Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                          </div>
                          
                          {otherUser?.specialization && userType === "patient" && (
                            <p className="text-xs text-primary mt-1">
                              {otherUser.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatHistory;
