const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/appointmentController");
const { verifyToken } = require("../middleware/auth");

// Get all appointments for a doctor
router.get(
  "/doctor/:doctorId",
  verifyToken,
  AppointmentController.getDoctorAppointments
);

// Get all appointments for a patient
router.get(
  "/patient/:patientId",
  verifyToken,
  AppointmentController.getPatientAppointments
);

// Get doctor's availability for a specific date range
router.get(
  "/availability/:doctorId",
  AppointmentController.getDoctorAvailability
);

// Book an appointment
router.post("/book", verifyToken, AppointmentController.bookAppointment);

// Book offline appointment
router.post("/book-offline", verifyToken, AppointmentController.bookOfflineAppointment);

// Confirm appointment (doctor action)
router.put("/:appointmentId/confirm", verifyToken, AppointmentController.confirmAppointment);

// Reject appointment (doctor action)
router.put("/:appointmentId/reject", verifyToken, AppointmentController.rejectAppointment);

// Test route to check if confirm endpoint is accessible
router.get("/test-confirm", (req, res) => {
  res.json({ success: true, message: "Confirm route is accessible" });
});

// Update appointment status
router.patch(
  "/:appointmentId/status",
  verifyToken,
  AppointmentController.updateAppointmentStatus
);

// Cancel appointment
router.delete(
  "/:appointmentId",
  verifyToken,
  AppointmentController.cancelAppointment
);

// Get appointment details
router.get(
  "/:appointmentId",
  verifyToken,
  AppointmentController.getAppointmentById
);

// Search doctors by specialty and availability
router.get("/search/doctors", AppointmentController.searchDoctors);

// Test Digital Samba API connectivity
router.get("/test-digitalsamba", async (req, res) => {
  try {
    const axios = require('axios');
    const DIGITAL_SAMBA_BASE_URL = process.env.DIGITAL_SAMBA_BASE_URL;
    const DEVELOPER_KEY = process.env.DEVELOPER_KEY;
    
    const response = await axios({
      method: 'GET',
      url: `${DIGITAL_SAMBA_BASE_URL}/rooms`,
      headers: {
        'Authorization': `Bearer ${DEVELOPER_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      message: 'Digital Samba API is working',
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Digital Samba API error',
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    });
  }
});

module.exports = router;
