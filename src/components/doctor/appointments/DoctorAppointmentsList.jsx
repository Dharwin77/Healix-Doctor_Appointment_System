import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Droplet, Venus, Cake, Video, ExternalLink, ChevronDown, ChevronUp, Archive, CheckCircle, Check, X, Users, UserCheck, UserX, ListTodo } from "lucide-react";
import PatientDetailsModal from "@/components/patient/PatientDetailsModal";
import { toast } from "sonner";
const API_URL = import.meta.env.VITE_API_URL;

const getAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

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

const DoctorAppointmentsList = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPatientModal, setShowPatientModal] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeView, setActiveView] = useState('active'); // 'active', 'completed', 'rejected', 'archived'

  const handleAppointmentAction = async (appointmentId, action) => {
    console.log(`Attempting to ${action} appointment:`, appointmentId);
    console.log('API_URL:', API_URL);
    console.log('User:', user);
    
    setActionLoading(appointmentId);
    try {
      const token = localStorage.getItem("token");
      console.log('Token exists:', !!token);
      
      const url = `${API_URL}/api/appointments/${appointmentId}/${action}`;
      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.success) {
        toast.success(`Appointment ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`);
        // Refresh appointments list
        await fetchAppointments();
      } else {
        console.error('API returned success: false', result);
        toast.error(result.message || `Failed to ${action} appointment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appointment:`, error);
      toast.error(`Failed to ${action} appointment: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/appointments/doctor/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    
    // Set up interval to check for status updates every 10 minutes
    const interval = setInterval(() => {
      fetchAppointments();
    }, 600000); // Check every 10 minutes (10 * 60 * 1000 milliseconds)
    
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

  // Separate appointments by status with improved filtering
  const activeAppointments = appointments.filter(apt => {
    // Show pending_confirmation appointments (newly booked, awaiting doctor action)
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

  const AppointmentCard = ({ apt, isCompleted = false }) => {
    const patient = apt.patientId;
    console.log('Rendering appointment:', apt._id, 'Status:', apt.status);
    return (
      <Card
        className={`shadow-sm border transition-all duration-200 ${
          isCompleted
            ? 'border-gray-200 bg-gray-50/50 hover:shadow-md'
            : apt.status === 'ongoing' 
            ? 'border-green-300 bg-green-50 shadow-md' 
            : 'border-border hover:border-primary/30 hover:shadow-md'
        }`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Patient Info */}
            <div className="flex items-center gap-5 min-w-[220px] flex-1">
              {patient?.profilePicture ? (
                <img
                  src={patient.profilePicture}
                  alt="Patient"
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
                  {patient?.firstName} {patient?.lastName}
                  {patient?.gender && (
                    <span title="Gender">
                      <Venus className="inline w-4 h-4 text-pink-500" />
                    </span>
                  )}
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                {/* Slot timings under name only for laptops */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {apt.appointmentDate?.slice(0, 10)}
                  {/* Vertical separator for desktop */}
                  <span className="h-5 border-l border-muted-foreground mx-3" />
                  <Clock className="w-4 h-4 mr-1" />
                  {apt.startTime} - {apt.endTime}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {patient?.dateOfBirth && (
                    <span className="flex items-center gap-1">
                      <Cake className="w-4 h-4" />{" "}
                      {getAge(patient.dateOfBirth)} yrs
                    </span>
                  )}
                  {patient?.bloodGroup && (
                    <span className="flex items-center gap-1">
                      <Droplet className="w-4 h-4" /> {patient.bloodGroup}
                    </span>
                  )}
                </div>
                {patient?.address?.city && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {patient.address.city}, {patient.address.state}
                  </div>
                )}
              </div>
            </div>
            
            {/* Appointment Info */}
            <div className="flex flex-col md:items-end gap-2 md:min-w-[200px]">
              {/* Hide slot timings here on desktop */}
              <div className="flex items-center text-sm text-muted-foreground md:hidden">
                <Calendar className="w-4 h-4 mr-1" />
                {apt.appointmentDate?.slice(0, 10)}
                <Clock className="w-4 h-4 ml-4 mr-1" />
                {apt.startTime} - {apt.endTime}
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium">Reason:</span>{" "}
                {apt.reasonForVisit || (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <div className="text-sm mt-1 flex items-center gap-2">
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
              <div className="flex items-center justify-between w-full md:justify-end">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apt.status === "ongoing"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : apt.status === "completed"
                      ? "bg-gray-100 text-gray-600 border border-gray-200"
                      : apt.status === "confirmed"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : apt.status === "pending"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                      : apt.status === "pending_confirmation"
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : apt.status === "cancelled"
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {apt.status === "pending_confirmation" ? "Awaiting Confirmation" : 
                   apt.status === "confirmed" ? "Confirmed" : apt.status}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-2">
                {/* Show Confirm/Reject buttons for pending appointments */}
                {(apt.status === 'pending_confirmation' || apt.status === 'pending') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === apt._id}
                      onClick={() => handleAppointmentAction(apt._id, 'reject')}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === apt._id}
                      onClick={() => handleAppointmentAction(apt._id, 'confirm')}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowPatientModal(true);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
          
          {/* Video Call Section - Fixed container to prevent layout shift */}
          <div className="mt-4">
            {apt.status === 'ongoing' && apt.roomUrl && (
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    <span className="font-semibold">Consultation Room</span>
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
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your patient appointments
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
          onClick={() => setActiveView('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeView === 'completed'
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Completed ({completedAppointments.length})
        </button>
        <button
          onClick={() => setActiveView('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeView === 'rejected'
              ? 'bg-white shadow-sm text-primary border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserX className="w-4 h-4" />
          Rejected ({rejectedAppointments.length})
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
            <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-4">
              {rejectedAppointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} isCompleted={true} />
              ))}
            </div>
          )}
        </div>
      )}

      <PatientDetailsModal
        open={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatient}
      />
    </div>
  );
};

export default DoctorAppointmentsList;
