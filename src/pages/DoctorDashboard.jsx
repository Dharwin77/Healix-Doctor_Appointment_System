import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, onAuthStateChanged, auth } from "../../firebase.config.js";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FaCalendarCheck,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaCalendarPlus,
  FaClock,
  FaChartBar,
  FaComments
} from "react-icons/fa";
import { useUser } from "../context/UserContext.jsx";
import { toast } from "sonner";
import axios from "axios";
import { io } from "socket.io-client";

import DoctorAppointmentsList from "@/components/doctor/appointments/DoctorAppointmentsList";
import DoctorScheduleCalendar from "@/components/doctor/appointments/DoctorScheduleCalendar";
import DoctorProfileForm from "@/components/doctor/DoctorProfileForm";
import DoctorAvailabilitySettings from "@/components/doctor/appointments/DoctorAvailabilitySettings";
import DoctorAnalytics from "@/components/doctor/Analytics.jsx";
import TodaysSchedule from "@/components/doctor/dashboard/TodaysSchedule";
import DoctorNotifications from "@/components/doctor/DoctorNotifications.jsx";
import LiveChat from "@/components/ChatBot/LiveChat.jsx";
import ChatHistory from "@/components/ChatBot/ChatHistory.jsx";
import RegularPatients from "@/components/doctor/dashboard/RegularPatients";
import ProfileCompletion from "@/components/doctor/dashboard/ProfileCompletion";
import PatientDetailsModal from "@/components/patient/PatientDetailsModal";
// import { useChatNotifications } from "../context/ChatContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [appointmentNotificationCount, setAppointmentNotificationCount] = useState(0);
  const navigate = useNavigate();
  const { logout } = useUser();
  const socketRef = useRef(null);
  // const { getTotalUnreadCount } = useChatNotifications();

  useEffect(() => {
    console.log('DoctorDashboard: Setting up auth listener');
    
    const initializeDoctor = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('DoctorDashboard: Auth state changed', !!firebaseUser);
          
          if (!firebaseUser) {
            console.log('DoctorDashboard: No user, redirecting to login');
            navigate("/login");
            return;
          }
          
          try {
            const token = localStorage.getItem("token");
            console.log('DoctorDashboard: Token exists:', !!token);
            
            if (!token) {
              console.log('DoctorDashboard: No token found, redirecting to login');
              navigate("/login");
              return;
            }
            
            const url = `${
              import.meta.env.VITE_API_URL || "http://localhost:5000"
            }/api/doctors/firebase/${firebaseUser.uid}`;
            console.log('DoctorDashboard: Fetching doctor profile from:', url);
            
            const res = await axios.get(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('DoctorDashboard: Doctor profile fetched:', res.data.doctor);
            setDoctorProfile(res.data.doctor);
            
          } catch (err) {
            console.error("Failed to fetch doctor profile:", err);
            toast.error("Failed to fetch doctor profile. Please login again.");
            navigate("/login");
          } finally {
            console.log('DoctorDashboard: Setting loading to false');
            setLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('DoctorDashboard: Auth setup error:', error);
        setLoading(false);
      }
    };
    
    initializeDoctor();
  }, [navigate]);

  useEffect(() => {
    if (doctorProfile && activeTab === "dashboard") {
      fetchDashboardData();
    }
  }, [doctorProfile, activeTab]);

  // Socket connection for appointment notifications
  useEffect(() => {
    if (!doctorProfile) return;

    try {
      const doctorId = doctorProfile.id || doctorProfile._id;
      console.log('Setting up socket connection for doctor:', doctorId);

      // Connect to Socket.IO server
      socketRef.current = io(API_URL, { 
        transports: ["websocket", "polling"], 
        withCredentials: true 
      });

      socketRef.current.on("connect", () => {
        console.log("Doctor connected to socket:", socketRef.current.id);
        
        // Join as doctor to receive appointment notifications
        socketRef.current.emit("joinRoom", {
          roomId: `doctor_${doctorId}`,
          user: {
            id: doctorId,
            name: `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`,
            profilePicture: doctorProfile.profilePicture
          },
          userType: "doctor"
        });
      });

      socketRef.current.on("disconnect", () => {
        console.log("Doctor disconnected from socket");
      });

      // Listen for new appointment bookings
      socketRef.current.on(`new-appointment-${doctorId}`, (data) => {
        console.log("New appointment notification received:", data);
        
        setAppointmentNotificationCount(prev => prev + 1);
        
        toast.info(`New Appointment Request!`, {
          description: `${data.patientName} has booked an appointment`,
          duration: 5000,
          action: {
            label: "View",
            onClick: () => setActiveTab("appointments")
          }
        });
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Socket connection error:', error);
      // Don't let socket errors break the component
    }
  }, [doctorProfile]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/doctors/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const handleViewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleCompleteProfile = () => {
    setActiveTab("profile");
  };

  const handleStartChat = (patient, roomId = null) => {
    setActiveChatPatient(patient);
    setActiveChatRoom(roomId || `chat_${patient.id || patient._id}_${doctorProfile?.id}`);
    setActiveTab("chat");
    toast.success(`Starting chat with ${patient.fullName || patient.name}`);
  };

  const handleNotificationCountChange = (count) => {
    setNotificationCount(count);
  };

  // Clear appointment notification count when visiting appointments tab
  const handleTabChange = (tabId) => {
    console.log('DoctorDashboard: Tab change requested:', tabId);
    if (tabId === "appointments") {
      setAppointmentNotificationCount(0);
    }
    setActiveTab(tabId);
  };

  const displayFirstName = doctorProfile?.firstName;
  const displayLastName = doctorProfile?.lastName;
  const displayProfilePicture = doctorProfile?.profilePicture;
  const displayEmail = doctorProfile?.email;

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { id: "appointments", label: "Appointments", icon: FaCalendarCheck },
    { id: "calendar", label: "Calendar", icon: FaCalendarPlus },
    { id: "availability", label: "Availability", icon: FaClock },
    { id: "chat", label: "Chat", icon: FaComments },
    { id: "analytics", label: "Analytics", icon: FaChartBar },
    { id: "profile", label: "Profile", icon: FaUser },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" },
    },
  };

  if (loading) {
    console.log('DoctorDashboard: Still loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-2">Loading Doctor Dashboard...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    console.log('DoctorDashboard: No doctor profile found');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-2">Unable to load doctor profile</div>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  console.log('DoctorDashboard: Rendering dashboard for doctor:', doctorProfile.firstName);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Mobile Navbar */}
      <div className="lg:hidden bg-background border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary font-sans">
            Healix
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={displayProfilePicture}
                alt={`${displayFirstName} ${displayLastName}`}
              />
              <AvatarFallback className="text-sm font-semibold">
                {(displayFirstName?.[0] || "") + (displayLastName?.[0] || "") ||
                  "D"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FaBars className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "linear" }}
          className="hidden lg:flex w-64 bg-background rounded-xl shadow-lg border border-border/50 h-[95vh] sticky top-[2vh] flex-col z-30 m-4 ml-4"
        >
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="text-2xl font-bold text-primary font-sans mb-4">
              Healix
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={displayProfilePicture}
                  alt={`${displayFirstName} ${displayLastName}`}
                />
                <AvatarFallback className="font-semibold text-lg">
                  {(displayFirstName?.[0] || "") +
                    (displayLastName?.[0] || "") || "D"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Dr.{" "}
                  {displayFirstName && displayLastName
                    ? `${displayFirstName} ${displayLastName}`
                    : "Doctor"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 flex-1">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.id === "chat" && notificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {notificationCount}
                    </span>
                  )}
                  {item.id === "appointments" && appointmentNotificationCount > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {appointmentNotificationCount}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>

          <Separator />

          {/* Settings & Logout */}
          <div className="p-4 space-y-2">
            

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150"
            >
              <FaSignOutAlt className="h-5 w-5" />
              <span>Log out</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed left-4 top-4 bottom-4 w-64 bg-background rounded-xl shadow-xl border border-border/50 z-50 flex flex-col"
              >
                {/* Mobile Header */}
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-primary font-sans">
                      Healix
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaTimes className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={displayProfilePicture}
                        alt={`${displayFirstName} ${displayLastName}`}
                      />
                      <AvatarFallback className="font-semibold text-lg">
                        {(displayFirstName?.[0] || "") +
                          (displayLastName?.[0] || "") || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Dr.{" "}
                        {displayFirstName && displayLastName
                          ? `${displayFirstName} ${displayLastName}`
                          : "Doctor"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="p-4 flex-1">
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                          activeTab === item.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                        {item.id === "chat" && notificationCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {notificationCount}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </nav>
                </div>

                <Separator className="mx-4" />

                {/* Mobile Settings & Logout */}
                <div className="p-4 space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("profile")}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
                  >
                    <FaUser className="h-5 w-5" />
                    <span>Profile</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150"
                  >
                    <FaCog className="h-5 w-5" />
                    <span>Settings</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150"
                  >
                    <FaSignOutAlt className="h-5 w-5" />
                    <span>Log out</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex gap-6 max-w-full mx-auto">
            {/* Main Dashboard Content */}
            <div className="flex-1">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Tab Content */}
            {activeTab === "dashboard" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="bg-background/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 font-serif">
                          Welcome back, Dr.{" "}
                          {displayFirstName && displayLastName
                            ? `${displayFirstName} ${displayLastName}`
                            : "Doctor"}
                          !
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground">
                          Manage your patients and appointments with ease
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden sm:block"
                      >
                        <Avatar className="h-12 w-12 md:h-16 md:w-16">
                          <AvatarImage
                            src={displayProfilePicture}
                            alt={`${displayFirstName} ${displayLastName}`}
                          />
                          <AvatarFallback className="text-lg md:text-xl font-semibold">
                            {(displayFirstName?.[0] || "") +
                              (displayLastName?.[0] || "") || "D"}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dashboard Grid */}
                {dashboardData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <TodaysSchedule appointments={dashboardData.todaysAppointments} />
                    </div>
                    <div className="space-y-6">
                      <ProfileCompletion 
                        profileData={dashboardData.profileCompletion}
                        onCompleteProfile={handleCompleteProfile}
                      />
                    </div>
                  </div>
                )}

                {dashboardData && (
                  <RegularPatients 
                    patients={dashboardData.regularPatients}
                    onViewDetails={handleViewPatientDetails}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "appointments" && (
              <motion.div variants={itemVariants}>
                <DoctorAppointmentsList />
              </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div variants={itemVariants}>
                <DoctorScheduleCalendar />
              </motion.div>
            )}

            {activeTab === "availability" && (
              <motion.div variants={itemVariants}>
                <DoctorAvailabilitySettings />
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div variants={itemVariants}>
                <div className="max-w-7xl w-full mx-auto space-y-6">
                  <h1 className="text-3xl font-bold text-foreground">Patient Communication</h1>
                  
                  {activeChatPatient && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {(activeChatPatient.fullName || activeChatPatient.name)?.split(' ').map(n => n[0]).join('') || 'P'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">
                              Chatting with {activeChatPatient.fullName || activeChatPatient.name}
                            </h3>
                            <p className="text-sm text-blue-600">Patient</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveChatPatient(null);
                              setActiveChatRoom(null);
                            }}
                            className="ml-auto"
                          >
                            End Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {activeChatPatient ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-4 text-foreground">
                        Chat with {activeChatPatient.fullName || activeChatPatient.name}
                      </h2>
                      <LiveChat 
                        roomId={activeChatRoom}
                        user={{
                          name: `Dr. ${displayFirstName || 'Doctor'} ${displayLastName || ''}`.trim(),
                          id: doctorProfile?._id,
                          profilePicture: displayProfilePicture
                        }}
                        userType="doctor"
                        targetUser={activeChatPatient}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chat History */}
                      <div>
                        <ChatHistory 
                          user={doctorProfile} 
                          userType="doctor" 
                        />
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="space-y-4">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-primary mb-1">Live Chat with Patient</h3>
                                <p className="text-sm text-muted-foreground">
                                  Click on any conversation from your chat history or open a dedicated chat window
                                </p>
                              </div>
                              <Button 
                                onClick={() => navigate("/live-chat", { state: { doctorProfile, activeChatPatient, activeChatRoom } })}
                                className="ml-4"
                              >
                                Open Live Chat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-blue-800 mb-1">Patient Notifications</h3>
                                <p className="text-sm text-blue-600">
                                  View and respond to patient messages
                                </p>
                              </div>
                              <div className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
                                {notificationCount} new
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div variants={itemVariants}>
                <DoctorAnalytics />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div variants={itemVariants}>
                <DoctorProfileForm />
              </motion.div>
            )}
              </motion.div>
            </div>

            {/* Persistent Notifications Panel - Visible on All Pages */}
            <div className="hidden lg:block w-80">
              <div className="sticky top-6">
                <DoctorNotifications 
                  user={doctorProfile}
                  onStartChat={handleStartChat}
                  onNotificationCountChange={handleNotificationCountChange}
                  showToasts={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        open={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatient}
      />
    </div>
  );
};

export default DoctorDashboard;
