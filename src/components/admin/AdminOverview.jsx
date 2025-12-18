import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaUsers, FaUserMd, FaCalendarCheck, FaComments, FaArrowUp, FaArrowDown } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading statistics...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Patients",
      value: stats?.stats?.totalPatients || 0,
      icon: FaUsers,
      change: stats?.stats?.newPatientsThisMonth || 0,
      changeLabel: "new this month",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      darkBgColor: "dark:bg-blue-950/20",
    },
    {
      title: "Total Doctors",
      value: stats?.stats?.totalDoctors || 0,
      icon: FaUserMd,
      change: stats?.stats?.newDoctorsThisMonth || 0,
      changeLabel: "new this month",
      color: "text-green-600",
      bgColor: "bg-green-50",
      darkBgColor: "dark:bg-green-950/20",
    },
    {
      title: "Total Appointments",
      value: stats?.stats?.totalAppointments || 0,
      icon: FaCalendarCheck,
      change: stats?.appointmentsByStatus?.pending || 0,
      changeLabel: "pending",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      darkBgColor: "dark:bg-purple-950/20",
    },
    {
      title: "Active Chats",
      value: stats?.stats?.activeChats || 0,
      icon: FaComments,
      change: 0,
      changeLabel: "ongoing",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      darkBgColor: "dark:bg-orange-950/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${stat.bgColor} ${stat.darkBgColor} border-${stat.color.split('-')[1]}-200`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </h3>
                    <div className="flex items-center mt-2 text-sm">
                      <FaArrowUp className={`h-3 w-3 ${stat.change > 0 ? 'text-green-600' : 'text-gray-400'} mr-1`} />
                      <span className={stat.change > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                        {stat.change} {stat.changeLabel}
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-full ${stat.bgColor} ${stat.darkBgColor}`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {stats.recentAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {appointment.patientId?.firstName && appointment.patientId?.lastName
                        ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                        : "Unknown Patient"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {appointment.doctorId?.firstName && appointment.doctorId?.lastName
                        ? `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
                        : "Unknown Doctor"} - {appointment.doctorId?.specializations?.[0] || "General"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        appointment.status === "confirmed"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30"
                          : appointment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30"
                          : appointment.status === "completed"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30"
                          : "bg-red-100 text-red-700 dark:bg-red-950/30"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent appointments
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.appointmentsByStatus && Object.entries(stats.appointmentsByStatus).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-sm text-muted-foreground capitalize">{status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
