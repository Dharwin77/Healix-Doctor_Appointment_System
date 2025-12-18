import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Clock, Search, RefreshCw, Users, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import LiveChat from "@/components/ChatBot/LiveChat.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminChatCenter = ({ adminProfile }) => {
  const [allChats, setAllChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDoctorChat, setActiveDoctorChat] = useState(null);
  const [activePatientChat, setActivePatientChat] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const loadAllChats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/api/chat/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setAllChats(response.data.data || []);
      } else {
        setError("Failed to load chat history");
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError("Failed to load chat history");
      setAllChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllChats();
    // Refresh chats every 30 seconds
    const interval = setInterval(loadAllChats, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return "No messages yet";
    return message.length > maxLength 
      ? message.substring(0, maxLength) + "..."
      : message;
  };

  const handleDoctorChatClick = (chat) => {
    const doctor = chat.doctorId;
    const patient = chat.patientId;
    const roomId = `chat_${patient._id || patient}_${doctor._id || doctor}`;
    
    setSelectedDoctor(doctor);
    setActiveDoctorChat({ chat, doctor, patient, roomId });
  };

  const handlePatientChatClick = (chat) => {
    const doctor = chat.doctorId;
    const patient = chat.patientId;
    const roomId = `chat_${patient._id || patient}_${doctor._id || doctor}`;
    
    setSelectedPatient(patient);
    setActivePatientChat({ chat, doctor, patient, roomId });
  };

  const filteredChats = allChats.filter(chat => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const doctorName = chat.doctorId?.firstName 
      ? `${chat.doctorId.firstName} ${chat.doctorId.lastName}`.toLowerCase()
      : "";
    const patientName = chat.patientId?.firstName 
      ? `${chat.patientId.firstName} ${chat.patientId.lastName}`.toLowerCase()
      : "";
    
    return doctorName.includes(searchLower) || patientName.includes(searchLower);
  });

  // Get unique doctors and patients
  const doctors = [...new Map(filteredChats.map(chat => [chat.doctorId._id, chat])).values()];
  const patients = [...new Map(filteredChats.map(chat => [chat.patientId._id, chat])).values()];

  if (loading && allChats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search doctors or patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAllChats}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{allChats.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Doctors</p>
                <p className="text-2xl font-bold">{doctors.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Doctors */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Stethoscope className="h-5 w-5 text-blue-500" />
                <span>Doctors</span>
                <Badge variant="secondary" className="ml-2">
                  {doctors.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {doctors.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No doctor conversations yet</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {doctors.map((chat, index) => {
                      const doctor = chat.doctorId;
                      const patient = chat.patientId;
                      const doctorName = doctor?.firstName 
                        ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                        : "Unknown Doctor";
                      const patientName = patient?.firstName 
                        ? `${patient.firstName} ${patient.lastName}`
                        : "Unknown Patient";
                      
                      const isActive = activeDoctorChat?.doctor?._id === doctor?._id;

                      return (
                        <motion.div
                          key={doctor._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="border-b border-border/50 last:border-b-0"
                        >
                          <button
                            onClick={() => handleDoctorChatClick(chat)}
                            className={`w-full p-4 hover:bg-muted/50 transition-colors duration-200 text-left ${
                              isActive ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={doctor?.profilePicture || ""} 
                                  alt={doctorName} 
                                />
                                <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
                                  {doctorName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'D'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium truncate text-sm">
                                    {doctorName}
                                  </h3>
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTime(chat.updatedAt)}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-primary mb-1">
                                  {doctor?.specialization || "General"}
                                </p>
                                
                                <p className="text-xs text-muted-foreground truncate">
                                  With: {patientName}
                                </p>
                                
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {truncateMessage(chat.lastMessage?.content)}
                                </p>
                              </div>
                              
                              {chat.messages?.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {chat.messages.length}
                                </Badge>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Doctor Chat */}
          {activeDoctorChat && (
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span>Chat with {activeDoctorChat.doctor.firstName} {activeDoctorChat.doctor.lastName}</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveDoctorChat(null);
                      setSelectedDoctor(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Patient: {activeDoctorChat.patient.firstName} {activeDoctorChat.patient.lastName}
                </p>
              </CardHeader>
              <CardContent>
                <LiveChat 
                  roomId={activeDoctorChat.roomId}
                  user={{
                    name: `${adminProfile?.firstName || 'Admin'} ${adminProfile?.lastName || ''}`.trim(),
                    id: adminProfile?._id,
                    profilePicture: adminProfile?.profilePicture
                  }}
                  userType="doctor"
                  targetUser={activeDoctorChat.patient}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Patients */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Users className="h-5 w-5 text-green-500" />
                <span>Patients</span>
                <Badge variant="secondary" className="ml-2">
                  {patients.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {patients.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No patient conversations yet</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {patients.map((chat, index) => {
                      const doctor = chat.doctorId;
                      const patient = chat.patientId;
                      const doctorName = doctor?.firstName 
                        ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                        : "Unknown Doctor";
                      const patientName = patient?.firstName 
                        ? `${patient.firstName} ${patient.lastName}`
                        : "Unknown Patient";
                      
                      const isActive = activePatientChat?.patient?._id === patient?._id;

                      return (
                        <motion.div
                          key={patient._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="border-b border-border/50 last:border-b-0"
                        >
                          <button
                            onClick={() => handlePatientChatClick(chat)}
                            className={`w-full p-4 hover:bg-muted/50 transition-colors duration-200 text-left ${
                              isActive ? 'bg-green-50 dark:bg-green-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={patient?.profilePicture || ""} 
                                  alt={patientName} 
                                />
                                <AvatarFallback className="bg-green-500 text-white text-sm font-semibold">
                                  {patientName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-medium truncate text-sm">
                                    {patientName}
                                  </h3>
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTime(chat.updatedAt)}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground truncate">
                                  With: {doctorName}
                                </p>
                                
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {truncateMessage(chat.lastMessage?.content)}
                                </p>
                              </div>
                              
                              {chat.messages?.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {chat.messages.length}
                                </Badge>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Patient Chat */}
          {activePatientChat && (
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>Chat with {activePatientChat.patient.firstName} {activePatientChat.patient.lastName}</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActivePatientChat(null);
                      setSelectedPatient(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Doctor: {activePatientChat.doctor.firstName} {activePatientChat.doctor.lastName}
                </p>
              </CardHeader>
              <CardContent>
                <LiveChat 
                  roomId={activePatientChat.roomId}
                  user={{
                    name: `${adminProfile?.firstName || 'Admin'} ${adminProfile?.lastName || ''}`.trim(),
                    id: adminProfile?._id,
                    profilePicture: adminProfile?.profilePicture
                  }}
                  userType="patient"
                  targetUser={activePatientChat.doctor}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatCenter;
