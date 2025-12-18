import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { onAuthStateChanged, auth } from "../../firebase.config.js";
import { useUser } from "../context/UserContext.jsx";
import LiveChat from "@/components/ChatBot/LiveChat.jsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
// import ChatRoomSelector from "@/components/ChatBot/ChatRoomSelector.jsx";

const LiveChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: contextUser } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState("");

  // Get data from navigation state (for doctor notifications)
  const navigationState = location.state || {};
  const { selectedPatient, doctorProfile, activeChatPatient, activeChatRoom, userType: stateUserType } = navigationState;

  // Determine user type and chat context
  const userType = stateUserType || contextUser?.role || "patient";
  const isDoctor = userType === "doctor";
  const targetUser = isDoctor ? (selectedPatient || activeChatPatient) : navigationState.selectedDoctor;

  // Get room ID from various sources
  const roomId = activeChatRoom || searchParams.get("room") || selectedRoom || 
    (targetUser ? `chat_${contextUser?.id}_${targetUser.id || targetUser._id}` : `chat_${contextUser?.id || 'general'}`);

  const handleRoomSelect = (roomId, roomName) => {
    setSelectedRoom(roomId);
    setSelectedRoomName(roomName);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/login");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const endpoint = userType === "doctor" ? "doctors" : "patients";
        const url = `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/${endpoint}/firebase/${firebaseUser.uid}`;
        
        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setUserProfile(res.data[userType] || res.data.patient || res.data.doctor);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, userType]);

  const handleGoBack = () => {
    if (userType === "doctor") {
      navigate("/doctor-dashboard");
    } else {
      navigate("/patient-dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGoBack}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {targetUser ? (
                          <>
                            Chat with {isDoctor ? '' : 'Dr. '}{targetUser.fullName || targetUser.name}
                            {targetUser.specialization && (
                              <span className="text-lg font-normal text-muted-foreground ml-2">
                                - {targetUser.specialization}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            Healix Live Chat
                            {selectedRoomName && (
                              <span className="text-lg font-normal text-muted-foreground ml-2">
                                - {selectedRoomName}
                              </span>
                            )}
                          </>
                        )}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {targetUser 
                          ? `Real-time communication with ${isDoctor ? 'patient' : 'your doctor'}`
                          : 'Real-time communication between doctors and patients'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Room: {roomId}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center"
        >
          <LiveChat
            roomId={roomId}
            user={{
              name: userType === "doctor" 
                ? `Dr. ${userProfile?.firstName || doctorProfile?.firstName || 'Doctor'} ${userProfile?.lastName || doctorProfile?.lastName || ''}`.trim()
                : `${userProfile?.firstName || 'Patient'} ${userProfile?.lastName || ''}`.trim(),
              id: contextUser?.id,
              profilePicture: userProfile?.profilePicture || doctorProfile?.profilePicture
            }}
            userType={userType}
            targetUser={targetUser}
          />
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-primary mb-2">How to use Live Chat:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Type your message and press Enter or click Send</li>
                <li>• You'll see typing indicators when the other person is typing</li>
                <li>• Messages are delivered in real-time when both parties are online</li>
                <li>• {userType === "doctor" ? "Patients" : "Doctors"} will join the same room to communicate</li>
                <li>• All conversations are secure and private</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveChatPage;