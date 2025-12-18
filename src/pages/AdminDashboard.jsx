import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, onAuthStateChanged, auth } from "../../firebase.config.js";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserMd,
  FaChartBar,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield
} from "react-icons/fa";
import { useUser } from "../context/UserContext.jsx";
import { toast } from "sonner";
import axios from "axios";

import AdminOverview from "@/components/admin/AdminOverview";
import DoctorsManagement from "@/components/admin/DoctorsManagement";
import PatientsManagement from "@/components/admin/PatientsManagement";
import SystemAnalytics from "@/components/admin/SystemAnalytics";
import AdminProfileForm from "@/components/admin/AdminProfileForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const navigate = useNavigate();
  const { logout } = useUser();

  useEffect(() => {
    console.log('AdminDashboard: Setting up auth listener');
    
    const initializeAdmin = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('AdminDashboard: Auth state changed', !!firebaseUser);
          
          if (!firebaseUser) {
            console.log('AdminDashboard: No user, redirecting to login');
            navigate("/login");
            return;
          }
          
          try {
            const token = localStorage.getItem("token");
            console.log('AdminDashboard: Token exists:', !!token);
            
            if (!token) {
              console.log('AdminDashboard: No token found, redirecting to login');
              navigate("/login");
              return;
            }
            
            const url = `${API_URL}/api/auth/user/${firebaseUser.uid}`;
            console.log('AdminDashboard: Fetching admin profile from:', url);
            
            const res = await axios.get(url, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('AdminDashboard: User profile fetched:', res.data.user);
            
            // Verify user is admin
            if (res.data.user.role !== 'admin') {
              toast.error("Access denied. Admin privileges required.");
              navigate("/login");
              return;
            }
            
            setAdminProfile(res.data.user);
            
          } catch (err) {
            console.error("Failed to fetch admin profile:", err);
            toast.error("Failed to fetch admin profile. Please login again.");
            navigate("/login");
          } finally {
            console.log('AdminDashboard: Setting loading to false');
            setLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('AdminDashboard: Auth setup error:', error);
        setLoading(false);
      }
    };
    
    initializeAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      localStorage.removeItem("token");
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: FaTachometerAlt },
    { id: "doctors", label: "Doctors", icon: FaUserMd },
    { id: "patients", label: "Patients", icon: FaUsers },
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
    console.log('AdminDashboard: Still loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-2">Loading Admin Dashboard...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (!adminProfile) {
    console.log('AdminDashboard: No admin profile found');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-xl mb-2">Unable to load admin profile</div>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  const displayFirstName = adminProfile?.firstName || adminProfile?.name?.split(' ')[0] || 'Admin';
  const displayLastName = adminProfile?.lastName || adminProfile?.name?.split(' ').slice(1).join(' ') || '';
  const displayEmail = adminProfile?.email || '';
  const displayProfilePicture = adminProfile?.profilePicture || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${displayFirstName} ${displayLastName}`;

  console.log('AdminDashboard: Rendering dashboard for admin:', displayFirstName);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Mobile Navbar */}
      <div className="lg:hidden bg-background border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary font-sans">
            Healix Admin
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={displayProfilePicture}
                alt={`${displayFirstName} ${displayLastName}`}
              />
              <AvatarFallback className="text-sm font-semibold">
                {(displayFirstName?.[0] || "") + (displayLastName?.[0] || "") || "A"}
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

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="hidden lg:flex w-64 bg-background border-r border-border/50 flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border/50">
            <div className="text-2xl font-bold text-primary mb-6 font-sans flex items-center space-x-2">
              <FaUserShield className="h-6 w-6" />
              <span>Healix Admin</span>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={displayProfilePicture}
                  alt={`${displayFirstName} ${displayLastName}`}
                />
                <AvatarFallback className="font-semibold text-lg">
                  {(displayFirstName?.[0] || "") + (displayLastName?.[0] || "") || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayFirstName && displayLastName
                    ? `${displayFirstName} ${displayLastName}`
                    : "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {displayEmail}
                </p>
                <p className="text-xs text-primary font-medium">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          <Separator />

          {/* Logout */}
          <div className="p-4">
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
                    <div className="text-2xl font-bold text-primary font-sans flex items-center space-x-2">
                      <FaUserShield className="h-5 w-5" />
                      <span>Healix Admin</span>
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
                        {(displayFirstName?.[0] || "") + (displayLastName?.[0] || "") || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {displayFirstName && displayLastName
                          ? `${displayFirstName} ${displayLastName}`
                          : "Admin"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {displayEmail}
                      </p>
                      <p className="text-xs text-primary font-medium">Administrator</p>
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
                      </motion.button>
                    ))}
                  </nav>
                </div>

                <Separator className="mx-4" />

                {/* Mobile Logout */}
                <div className="p-4">
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
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Tab Content */}
              {activeTab === "overview" && (
                <motion.div variants={itemVariants} className="space-y-6">
                  <Card className="bg-background/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 font-serif">
                            Welcome back, {displayFirstName}!
                          </h1>
                          <p className="text-lg md:text-xl text-muted-foreground">
                            Manage your platform with complete control
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
                              {(displayFirstName?.[0] || "") + (displayLastName?.[0] || "") || "A"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>

                  <AdminOverview />
                </motion.div>
              )}

              {activeTab === "doctors" && (
                <motion.div variants={itemVariants}>
                  <DoctorsManagement />
                </motion.div>
              )}

              {activeTab === "patients" && (
                <motion.div variants={itemVariants}>
                  <PatientsManagement />
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div variants={itemVariants}>
                  <SystemAnalytics />
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div variants={itemVariants}>
                  <AdminProfileForm adminProfile={adminProfile} setAdminProfile={setAdminProfile} />
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
