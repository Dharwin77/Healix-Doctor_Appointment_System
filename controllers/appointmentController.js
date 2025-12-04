require('dotenv').config();

const Appointment = require("../models/appointment");
const DoctorAvailability = require("../models/doctorAvailability");
const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const { 
  handleAppointmentCreated,
  handleAppointmentUpdated,
  handleAppointmentDeleted 
} = require('../middleware/appointmentEvents');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Digital Samba Configuration
const DIGITAL_SAMBA_BASE_URL = process.env.DIGITAL_SAMBA_BASE_URL ;
const TEAM_ID = process.env.TEAM_ID;
const SUBDOMAIN = process.env.SUBDOMAIN ;
const DEVELOPER_KEY = process.env.DEVELOPER_KEY;

// Add debug logging
console.log('Environment variables loaded:', {
  DIGITAL_SAMBA_BASE_URL,
  TEAM_ID: !!TEAM_ID,
  SUBDOMAIN,
  DEVELOPER_KEY: !!DEVELOPER_KEY
});

// Helper function to make authenticated requests to Digital Samba
const makeDigitalSambaRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${DIGITAL_SAMBA_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${DEVELOPER_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Digital Samba API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

// Generate unique room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to check and update appointment status based on time
const checkAndUpdateAppointmentStatus = async (appointment) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const appointmentDate = appointment.appointmentDate.toISOString().split('T')[0];
  
  // Only process appointments for today
  if (appointmentDate === today) {
    let newStatus = appointment.status;
    
    // If appointment is pending and current time >= start time, make it ongoing
    if (appointment.status === 'pending' && currentTime >= appointment.startTime) {
      newStatus = 'ongoing';
    }
    // If appointment is ongoing and current time >= end time, make it completed
    else if (appointment.status === 'ongoing' && currentTime >= appointment.endTime) {
      newStatus = 'completed';
    }
    
    // Update status if it changed
    if (newStatus !== appointment.status) {
      await Appointment.findByIdAndUpdate(appointment._id, { status: newStatus });
      appointment.status = newStatus;
    }
  }
  // If appointment date is in the past and not completed/cancelled, mark as completed
  else if (appointmentDate < today && !['completed', 'cancelled'].includes(appointment.status)) {
    await Appointment.findByIdAndUpdate(appointment._id, { status: 'completed' });
    appointment.status = 'completed';
  }
  
  return appointment;
};

class AppointmentController {
  // Get all appointments for a doctor
  static async getDoctorAppointments(req, res) {
    try {
      const { doctorId } = req.params;
      const { date, status } = req.query;

      let query = { doctorId };

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.appointmentDate = { $gte: startDate, $lt: endDate };
      }

      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .populate("patientId", "firstName lastName profilePicture phoneNumber dateOfBirth gender bloodGroup address")
        .sort({ appointmentDate: 1, startTime: 1 });

      // Check and update status for each appointment
      const updatedAppointments = [];
      for (const appointment of appointments) {
        const updatedAppointment = await checkAndUpdateAppointmentStatus(appointment);
        updatedAppointments.push(updatedAppointment);
      }

      res.json({ success: true, appointments: updatedAppointments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get all appointments for a patient
  static async getPatientAppointments(req, res) {
    try {
      const { patientId } = req.params;
      const { status } = req.query;

      let query = { patientId };

      if (status) {
        query.status = status;
      }

      const appointments = await Appointment.find(query)
        .populate(
          "doctorId",
            "firstName lastName specializations profilePicture address"
        )
        .sort({ appointmentDate: 1, startTime: 1 });

      // Check and update status for each appointment
      const updatedAppointments = [];
      for (const appointment of appointments) {
        const updatedAppointment = await checkAndUpdateAppointmentStatus(appointment);
        updatedAppointments.push(updatedAppointment);
      }

      res.json({ success: true, appointments: updatedAppointments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get doctor's availability for a specific date range
  static async getDoctorAvailability(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      const availability = await DoctorAvailability.findOne({ doctorId });

      if (!availability) {
        return res.status(404).json({
          success: false,
          message: "Doctor availability not found",
        });
      }

      const availableSlots = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
      ) {
        const dayOfWeek = date.toLocaleDateString("en-US", {
          weekday: "lowercase",
        });
        const daySchedule = availability.weeklySchedule[dayOfWeek];

        if (daySchedule.isAvailable) {
          // Check for specific date overrides
          const specificDate = availability.specificDates.find(
            (sd) => sd.date.toDateString() === date.toDateString()
          );

          if (specificDate && !specificDate.isAvailable) {
            continue; // Skip this date
          }

          // Generate slots for this day
          const slots = availability.generateSlotsForDay(new Date(date));

          // Check for existing appointments
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);

          const existingAppointments = await Appointment.find({
            doctorId,
            appointmentDate: {
              $gte: dayStart,
              $lt: dayEnd,
            },
            status: { $in: ["pending", "ongoing"] },
          });

          // Filter out booked slots
          const availableSlotsForDay = slots.filter((slot) => {
            return !existingAppointments.some(
              (apt) =>
                apt.startTime === slot.startTime && apt.endTime === slot.endTime
            );
          });

          if (availableSlotsForDay.length > 0) {
            availableSlots.push({
              date: new Date(date),
              slots: availableSlotsForDay,
              fee: availability.consultationFee,
            });
          }
        }
      }

      res.json({ success: true, availableSlots });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Book an appointment
  static async bookAppointment(req, res) {
    try {
      const {
        doctorId,
        patientId,
        appointmentType,
        appointmentDate,
        startTime,
        endTime,
        reasonForVisit,
        symptoms,
      } = req.body;

      // Check if the slot is still available
      const existingAppointment = await Appointment.findOne({
        doctorId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        status: { $in: ["pending", "ongoing"] },
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: "This time slot is no longer available",
        });
      }

      // Get doctor's consultation fee
      const availability = await DoctorAvailability.findOne({ doctorId });
      if (!availability) {
        return res.status(404).json({
          success: false,
          message: "Doctor availability not found",
        });
      }

      // Get doctor and patient details for room creation
      const doctor = await Doctor.findById(doctorId);
      const patient = await Patient.findById(patientId);

      if (!doctor || !patient) {
        return res.status(404).json({
          success: false,
          message: "Doctor or patient not found",
        });
      }

      // Generate room ID first
      const roomId = generateRoomId();
      let roomUrl = `https://healix.digitalsamba.com/${roomId}`;
      
      // Create Digital Samba room
      try {
        console.log('Creating Digital Samba room...');
        console.log('Team ID:', TEAM_ID);
        console.log('Full Subdomain:', SUBDOMAIN);
        console.log('Developer Key exists:', !!DEVELOPER_KEY);
        console.log('Generated Room ID:', roomId);
        
        const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        
        // Calculate expires_at time (1 hour after appointment ends)
        const appointmentDateTime = new Date(appointmentDate);
        const [endHour, endMinute] = endTime.split(':');
        appointmentDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        // Add 1 hour to the appointment end time
        const expiresAt = new Date(appointmentDateTime.getTime() + (60 * 60 * 1000));
        const expiresAtString = expiresAt.toISOString().slice(0, 19).replace('T', ' ');
        
        console.log('Appointment end time:', appointmentDateTime);
        console.log('Room expires at:', expiresAtString);
        
        const roomData = {
          team_id: TEAM_ID,
          friendly_url: roomId,
          privacy: 'public',
          name: `Appointment Room - ${doctorName}`,
          description: `Video consultation room for appointment between ${doctorName} and ${patient.firstName} ${patient.lastName}`,
          expires_at: expiresAtString,
          features: {
            chat: true,
            screen_sharing: true,
            recording: true,
            whiteboard: true
          }
        };

        console.log('Room data:', JSON.stringify(roomData, null, 2));
        const roomResponse = await makeDigitalSambaRequest('POST', '/rooms', roomData);
        console.log('Room created successfully:', roomResponse);
        console.log('Final room URL:', roomUrl);
      } catch (error) {
        console.error('Failed to create Digital Samba room:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        // Keep the room URL even if API call fails - room might still be accessible
        console.log('Continuing with room URL despite API error:', roomUrl);
      }

      // Create new appointment with room URL
      console.log('Creating appointment with room URL:', roomUrl);
      const appointment = new Appointment({
        doctorId,
        patientId,
        appointmentType: appointmentType || "online", // Default to online if not specified
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        reasonForVisit,
        symptoms: symptoms || [],
        fee: availability.consultationFee,
        status: "pending_confirmation",
        roomUrl: roomUrl, // Ensure this is always set
      });

      console.log('Appointment data before save:', {
        roomUrl: appointment.roomUrl,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId
      });

      await appointment.save();
      console.log('Appointment saved with room URL:', appointment.roomUrl);

      // Populate the appointment with doctor and patient details
      await appointment.populate([
        { path: "doctorId", select: "firstName lastName specializations" },
        { path: "patientId", select: "firstName lastName phoneNumber" },
      ]);

      // Emit real-time notification to doctor about new appointment
      const io = req.app.get('io');
      if (io) {
        const notificationData = {
          appointmentId: appointment._id,
          patientName: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
          patientPhone: appointment.patientId.phoneNumber,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          reasonForVisit: appointment.reasonForVisit,
          message: "New appointment booking received!"
        };
        console.log('Emitting new appointment notification to doctor:', appointment.doctorId._id);
        io.emit(`new-appointment-${appointment.doctorId._id}`, notificationData);
      }

      // Trigger Google Calendar event creation (async)
      handleAppointmentCreated(appointment._id);

      res.status(201).json({
        success: true,
        message: "Appointment booked successfully",
        appointment,
      });
    } catch (error) {
      console.error('Appointment booking error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(req, res) {
    try {
      const { appointmentId } = req.params;
      const { status, doctorNotes, prescription } = req.body;

      // Get the current appointment
      const currentAppointment = await Appointment.findById(appointmentId);
      if (!currentAppointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Validate status transition based on time
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      const appointmentDate = currentAppointment.appointmentDate.toISOString().split('T')[0];

      // If trying to set status to ongoing, validate time window
      if (status === 'ongoing') {
        if (appointmentDate !== today) {
          return res.status(400).json({
            success: false,
            message: "Cannot set appointment to ongoing - not scheduled for today",
          });
        }
        if (currentTime < currentAppointment.startTime) {
          return res.status(400).json({
            success: false,
            message: "Cannot set appointment to ongoing - appointment hasn't started yet",
          });
        }
        if (currentTime >= currentAppointment.endTime) {
          return res.status(400).json({
            success: false,
            message: "Cannot set appointment to ongoing - appointment time has passed",
          });
        }
      }

      // If trying to set any status other than completed/cancelled for a past appointment
      if (appointmentDate < today && !['completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot change status for past appointments except to completed or cancelled",
        });
      }

      const updateData = { status };

      if (doctorNotes) updateData.doctorNotes = doctorNotes;
      if (prescription) updateData.prescription = prescription;

      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        updateData,
        { new: true }
      ).populate([
        { path: "doctorId", select: "firstName lastName specializations" },
        { path: "patientId", select: "firstName lastName phoneNumber" },
      ]);

      handleAppointmentUpdated(appointment._id);
    
      res.json({ success: true, appointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Cancel appointment
  static async cancelAppointment(req, res) {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;

      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          status: "cancelled",
          notes: reason || "Cancelled by user",
        },
        { new: true }
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
       handleAppointmentUpdated(appointment._id);

      res.json({
        success: true,
        message: "Appointment cancelled successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get appointment details
  static async getAppointmentById(req, res) {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findById(appointmentId)
        .populate(
          "doctorId",
          "firstName lastName specializations profilePicture phoneNumber"
        )
        .populate(
          "patientId",
          "firstName lastName profilePicture phoneNumber dateOfBirth gender"
        );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      // Check and update status before returning
      const updatedAppointment = await checkAndUpdateAppointmentStatus(appointment);

      res.json({ success: true, appointment: updatedAppointment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Search doctors by specialty and availability
  static async searchDoctors(req, res) {
    try {
      const { specialty, city, date, minRating } = req.query;

      let doctorQuery = {
        profileCompleted: true,
      };

      if (specialty) {
        doctorQuery.specializations = { $in: [specialty] };
      }

      if (city) {
        doctorQuery["address.city"] = new RegExp(city, "i");
      }

      if (minRating) {
        doctorQuery.averageRating = { $gte: parseFloat(minRating) };
      }

      const doctors = await Doctor.find(doctorQuery)
        .select(
          "firstName lastName specializations averageRating totalReviews profilePicture address"
        )
        .sort({ averageRating: -1 });

      // If date is provided, filter by availability
      if (date && doctors.length > 0) {
        const availableDoctors = [];

        for (const doctor of doctors) {
          const availability = await DoctorAvailability.findOne({
            doctorId: doctor._id,
          });

          if (availability) {
            const requestedDate = new Date(date);
            const dayOfWeek = requestedDate
              .toLocaleDateString("en-US", { weekday: "long" })
              .toLowerCase();
            const daySchedule = availability.weeklySchedule[dayOfWeek];

            if (daySchedule && daySchedule.isAvailable) {
              // Check if there are available slots
              const slots = availability.generateSlotsForDay(requestedDate);
              const existingAppointments = await Appointment.find({
                doctorId: doctor._id,
                appointmentDate: requestedDate,
                status: { $in: ["pending", "ongoing"] },
              });

              const availableSlots = slots.filter((slot) => {
                return !existingAppointments.some(
                  (apt) => apt.startTime === slot.startTime
                );
              });

              if (availableSlots.length > 0) {
                availableDoctors.push({
                  ...doctor.toObject(),
                  availableSlots: availableSlots.length,
                  consultationFee: availability.consultationFee,
                });
              }
            }
          }
        }

        return res.json({ success: true, doctors: availableDoctors });
      }

      res.json({ success: true, doctors });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Book offline appointment
  static async bookOfflineAppointment(req, res) {
    try {
      const {
        doctorId,
        patientId,
        preferredDate,
        preferredTimeSlot,
        alternateDate,
        alternateTimeSlot,
        reasonForVisit,
        symptoms,
        urgencyLevel,
        contactNumber,
        alternateContactNumber,
        additionalNotes,
        transportationMode,
        accompaniedBy
      } = req.body;

      // Validate required fields
      if (!doctorId || !patientId || !preferredDate || !preferredTimeSlot || !reasonForVisit || !contactNumber) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Get doctor and patient details
      const doctor = await Doctor.findById(doctorId);
      const patient = await Patient.findById(patientId);

      if (!doctor || !patient) {
        return res.status(404).json({
          success: false,
          message: "Doctor or patient not found"
        });
      }

      // Get doctor's consultation fee
      const availability = await DoctorAvailability.findOne({ doctorId });
      const consultationFee = availability ? availability.consultationFee : doctor.consultationFee || 500;

      // Create offline appointment request
      const offlineAppointment = new Appointment({
        doctorId,
        patientId,
        appointmentType: "offline",
        appointmentDate: new Date(preferredDate),
        startTime: preferredTimeSlot,
        endTime: addMinutes(preferredTimeSlot, 30), // Default 30 minutes
        reasonForVisit,
        symptoms: symptoms || [],
        fee: consultationFee,
        status: "pending_confirmation",
        
        // Offline specific fields
        preferredDate: new Date(preferredDate),
        preferredTimeSlot,
        alternateDate: alternateDate ? new Date(alternateDate) : null,
        alternateTimeSlot,
        urgencyLevel: urgencyLevel || "normal",
        contactNumber,
        alternateContactNumber,
        additionalNotes,
        transportationMode,
        accompaniedBy,
        
        // No room URL for offline appointments
        roomUrl: null,
        
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await offlineAppointment.save();

      // Populate the appointment with doctor and patient details
      await offlineAppointment.populate([
        { path: "doctorId", select: "firstName lastName email specializations contactNumber address" },
        { path: "patientId", select: "firstName lastName email contactNumber" }
      ]);

      // Emit real-time notification to doctor about new offline appointment
      const io = req.app.get('io');
      if (io) {
        const notificationData = {
          appointmentId: offlineAppointment._id,
          patientName: `${offlineAppointment.patientId.firstName} ${offlineAppointment.patientId.lastName}`,
          patientPhone: offlineAppointment.contactNumber,
          appointmentType: 'offline',
          preferredDate: offlineAppointment.preferredDate,
          preferredTimeSlot: offlineAppointment.preferredTimeSlot,
          reasonForVisit: offlineAppointment.reasonForVisit,
          urgencyLevel: offlineAppointment.urgencyLevel,
          message: "New offline appointment request received!"
        };
        console.log('Emitting new offline appointment notification to doctor:', offlineAppointment.doctorId._id);
        io.emit(`new-appointment-${offlineAppointment.doctorId._id}`, notificationData);
      }

      console.log('Offline appointment created:', {
        appointmentId: offlineAppointment._id,
        doctor: `${doctor.firstName} ${doctor.lastName}`,
        patient: `${patient.firstName} ${patient.lastName}`,
        preferredDate: preferredDate,
        preferredTimeSlot: preferredTimeSlot,
        urgencyLevel: urgencyLevel
      });

      res.status(201).json({
        success: true,
        message: "Offline appointment request submitted successfully",
        appointment: offlineAppointment
      });

    } catch (error) {
      console.error("Error creating offline appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create offline appointment request"
      });
    }
  }

  // Confirm appointment (doctor action)
  static async confirmAppointment(req, res) {
    console.log('confirmAppointment method called');
    console.log('Request params:', req.params);
    console.log('Request user:', req.user);
    
    try {
      const { appointmentId } = req.params;
      console.log('Confirming appointment ID:', appointmentId);

      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'firstName lastName email')
        .populate('doctorId', 'firstName lastName');

      console.log('Found appointment:', appointment ? appointment._id : 'Not found');

      if (!appointment) {
        console.log('Appointment not found in database');
        return res.status(404).json({
          success: false,
          message: "Appointment not found"
        });
      }

      console.log('Current appointment status:', appointment.status);

      // Update appointment status
      appointment.status = 'confirmed';
      await appointment.save();

      console.log('Appointment status updated to confirmed');

      // Emit real-time notification to patient
      const io = req.app.get('io');
      console.log('Socket.IO instance:', !!io);
      
      if (io) {
        const notificationData = {
          appointmentId: appointment._id,
          doctorName: `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          message: "Your appointment has been confirmed!"
        };
        console.log('Emitting notification:', notificationData);
        io.emit(`appointment-confirmed-${appointment.patientId._id}`, notificationData);
      }

      console.log('Sending success response');

      res.status(200).json({
        success: true,
        message: "Appointment confirmed successfully",
        appointment
      });

    } catch (error) {
      console.error("Error confirming appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to confirm appointment",
        error: error.message
      });
    }
  }

  // Reject appointment (doctor action)
  static async rejectAppointment(req, res) {
    try {
      const { appointmentId } = req.params;

      const appointment = await Appointment.findById(appointmentId)
        .populate('patientId', 'firstName lastName email')
        .populate('doctorId', 'firstName lastName');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found"
        });
      }

      // Update appointment status
      appointment.status = 'cancelled';
      appointment.cancellationReason = 'Rejected by doctor';
      await appointment.save();

      // Emit real-time notification to patient
      const io = req.app.get('io');
      if (io) {
        io.emit(`appointment-rejected-${appointment.patientId._id}`, {
          appointmentId: appointment._id,
          doctorName: `Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          message: "Your appointment request has been declined. Please choose another time slot."
        });
      }

      res.status(200).json({
        success: true,
        message: "Appointment rejected successfully",
        appointment
      });

    } catch (error) {
      console.error("Error rejecting appointment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reject appointment"
      });
    }
  }
}

// Helper function to add minutes to a time string
function addMinutes(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return date.toTimeString().slice(0, 5);
}

module.exports = AppointmentController;
