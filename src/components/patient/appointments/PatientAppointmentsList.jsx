import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Video, ExternalLink, ChevronDown, ChevronUp, Archive, CheckCircle, Users, UserCheck, UserX, ListTodo, Printer } from "lucide-react";
import AppointmentReceipt from "./AppointmentReceipt";
const API_URL = import.meta.env.VITE_API_URL;

const checkAppointmentStatus = (appointmentDate, startTime, endTime, currentStatus) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  
  const aptDate = appointmentDate?.slice(0, 10);
  
  // Only update if appointment is today
  if (aptDate === today) {
    if (currentStatus === 'pending' && currentTime >= startTime) {
      return 'ongoing';
    } else if (currentStatus === 'ongoing' && currentTime >= endTime) {
      return 'completed';
    }
  }
  
  return currentStatus;
};

const updateAppointmentStatus = async (appointmentId, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
};

const PatientAppointmentsList = ({ notificationCounts: propNotificationCounts, onNotificationCountChange: propOnNotificationCountChange }) => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeView, setActiveView] = useState('active'); // 'active', 'completed', 'rejected', 'archived'
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notificationCounts, setNotificationCounts] = useState(
    propNotificationCounts || {
      confirmed: 0,
      rejected: 0
    }
  );

  // Sync notification counts from props
  useEffect(() => {
    if (propNotificationCounts) {
      setNotificationCounts(propNotificationCounts);
    }
  }, [propNotificationCounts]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/api/appointments/patient/${user.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    
    if (data.success) {
      // Check and update appointment statuses
      const updatedAppointments = [];
      for (const apt of data.appointments) {
        const newStatus = checkAppointmentStatus(
          apt.appointmentDate,
          apt.startTime,
          apt.endTime,
          apt.status
        );
        
        if (newStatus !== apt.status) {
          await updateAppointmentStatus(apt._id, newStatus);
          apt.status = newStatus;
        }
        
        updatedAppointments.push(apt);
      }
      
      setAppointments(updatedAppointments);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
    
    // Set up interval to check for status updates every minute
    const interval = setInterval(() => {
      fetchAppointments();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // Helper function to check if appointment is past
  const isPastAppointment = (appointmentDate, endTime) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const aptDate = appointmentDate?.slice(0, 10);
    
    // If appointment date is before today, it's past
    if (aptDate < today) return true;
    
    // If appointment is today but end time has passed, it's past
    if (aptDate === today && endTime < currentTime) return true;
    
    return false;
  };

  // Clear notification count when viewing specific tab
  const handleTabClick = (view) => {
    setActiveView(view);
    if (view === 'completed' || view === 'rejected') {
      // Clear relevant notification count when viewing the tab
      const updatedCounts = {
        ...notificationCounts,
        [view === 'completed' ? 'confirmed' : 'rejected']: 0
      };
      setNotificationCounts(updatedCounts);
      
      // Notify parent component of the change
      if (propOnNotificationCountChange) {
        propOnNotificationCountChange(updatedCounts);
      }
    }
  };

  // Separate appointments by status with improved filtering
  const activeAppointments = appointments.filter(apt => {
    // Show pending_confirmation appointments (awaiting doctor confirmation)
    if (apt.status === 'pending_confirmation') {
      return true;
    }
    
    // Show ongoing appointments
    if (apt.status === 'ongoing') {
      return true;
    }
    
    // Show confirmed appointments (regardless of date)
    if (apt.status === 'confirmed') {
      return true;
    }
    
    // Exclude all other statuses (cancelled, completed, pending)
    return false;
  });
  
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  
  const rejectedAppointments = appointments.filter(apt => apt.status === 'cancelled');

  const handlePrintReceipt = (apt) => {
    // Format appointment data for receipt with ALL details
    const receiptData = {
      appointmentType: apt.appointmentType || 'offline',
      preferredDate: apt.appointmentDate,
      preferredTimeSlot: apt.startTime,
      endTime: apt.endTime,
      alternateDate: apt.alternateDate || null,
      alternateTimeSlot: apt.alternateTimeSlot || null,
      reasonForVisit: apt.reasonForVisit || 'Consultation',
      symptoms: apt.symptoms || [],
      status: apt.status,
      referenceNumber: apt._id || `HLX-${Date.now().toString().slice(-8)}`,
      bookedAt: apt.createdAt || new Date().toISOString(),
      contactNumber: apt.contactNumber || user?.phone || 'N/A',
      alternateContactNumber: apt.alternateContactNumber || null,
      urgencyLevel: apt.urgencyLevel || 'normal',
      transportationMode: apt.transportationMode || null,
      accompaniedBy: apt.accompaniedBy || null,
      additionalNotes: apt.additionalNotes || null
    };
    
    setSelectedAppointment({ data: receiptData, doctor: apt.doctorId });
    setShowReceipt(true);
  };

  const AppointmentCard = ({ apt, isCompleted = false }) => (
    <Card 
      className={`transition-all duration-200 ${
        isCompleted
          ? 'border-gray-200 bg-gray-50/50 hover:shadow-md'
          : apt.status === 'ongoing' 
          ? 'border-green-300 bg-green-50 shadow-md' 
          : 'border-border hover:border-primary/30 hover:shadow-md'
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {apt.doctorId?.profilePicture ? (
              <img
                src={apt.doctorId.profilePicture}
                alt="Doctor"
                className={`w-16 h-16 rounded-full object-cover border-2 flex-shrink-0 ${
                  isCompleted ? 'border-gray-300' : 'border-primary/20'
                }`}
              />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                isCompleted 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'bg-primary/10 border-primary/20'
              }`}>
                <User className={`w-8 h-8 ${isCompleted ? 'text-gray-500' : 'text-primary'}`} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg flex items-center gap-2">
                Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                {isCompleted && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {apt.doctorId?.specializations?.slice(0, 2).join(", ")}
              </div>
              {apt.doctorId?.address?.city && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {apt.doctorId.address.city}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-3 md:min-w-[200px]">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              {apt.appointmentDate?.slice(0, 10)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {apt.startTime} - {apt.endTime}
            </div>
            
            {apt.reasonForVisit && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span>{" "}
                <span className="text-muted-foreground">{apt.reasonForVisit}</span>
              </div>
            )}
            
            <div className="text-sm flex items-center gap-2">
              <span className="font-medium">Type:</span>
              <span className="flex items-center gap-1">
                {apt.appointmentType === 'online' ? (
                  <>
                    <Video className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-600">Online</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Offline</span>
                  </>
                )}
              </span>
            </div>
            
            <div className="flex items-center justify-between w-full md:justify-end gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  apt.status === "ongoing"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : apt.status === "completed"
                    ? "bg-gray-100 text-gray-600 border border-gray-200"
                    : apt.status === "pending"
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {apt.status}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintReceipt(apt)}
                className="flex items-center gap-1"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
        
        {/* Video Call Section - Fixed height container to prevent layout shift */}
        <div className="mt-4 h-auto">
          {apt.status === 'ongoing' && apt.roomUrl && (
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  <span className="font-semibold">Consultation Ready</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-medium"
                  onClick={() => window.open(apt.roomUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Video Call
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Appointments</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your appointments with doctors
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAppointments}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveView('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeView === 'active'
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          Active ({activeAppointments.length})
        </button>
        <button
          onClick={() => handleTabClick('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeView === 'completed'
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Completed ({completedAppointments.length})
          {notificationCounts.confirmed > 0 && (
            <Badge className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
              {notificationCounts.confirmed}
            </Badge>
          )}
        </button>
        <button
          onClick={() => handleTabClick('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeView === 'rejected'
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserX className="w-4 h-4" />
          Rejected ({rejectedAppointments.length})
          {notificationCounts.rejected > 0 && (
            <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
              {notificationCounts.rejected}
            </Badge>
          )}
        </button>
      </div>

      {/* Content based on active view */}
      {activeView === 'active' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Active Appointments</h3>
            <p className="text-muted-foreground text-sm">
              Confirmed and ongoing appointments
            </p>
          </div>
          {activeAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No active appointments</h3>
                <p className="text-sm text-muted-foreground text-center">
                  You don't have any confirmed or ongoing appointments at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeAppointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'completed' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Completed Appointments</h3>
            <p className="text-muted-foreground text-sm">
              Past completed consultations
            </p>
          </div>
          {completedAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No completed appointments</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Completed appointments will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedAppointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} isCompleted={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'rejected' && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Rejected Appointments</h3>
            <p className="text-muted-foreground text-sm">
              Appointments that were cancelled or rejected
            </p>
          </div>
          {rejectedAppointments.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserX className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No rejected appointments</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Rejected appointments will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedAppointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} isCompleted={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointment Receipt Modal */}
      {showReceipt && selectedAppointment && (
        <AppointmentReceipt
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedAppointment(null);
          }}
          appointmentData={selectedAppointment.data}
          doctor={selectedAppointment.doctor}
          patient={user}
        />
      )}
    </div>
  );
};

export default PatientAppointmentsList;
