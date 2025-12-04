const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllDoctors,
  getAllPatients,
  getAllAppointments,
  deleteUser,
  updateAppointmentStatus,
  getSystemAnalytics,
  getAdminProfile,
  updateAdminProfile
} = require("../controllers/adminController");
const { verifyToken } = require("../middleware/auth");

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: "Access denied. Admin privileges required."
    });
  }
  next();
};

// Dashboard statistics
router.get("/dashboard/stats", verifyToken, isAdmin, getDashboardStats);

// User management
router.get("/doctors", verifyToken, isAdmin, getAllDoctors);
router.get("/patients", verifyToken, isAdmin, getAllPatients);
router.delete("/users/:userType/:userId", verifyToken, isAdmin, deleteUser);

// Appointment management
router.get("/appointments", verifyToken, isAdmin, getAllAppointments);
router.patch("/appointments/:appointmentId/status", verifyToken, isAdmin, updateAppointmentStatus);

// Analytics
router.get("/analytics", verifyToken, isAdmin, getSystemAnalytics);

// Admin profile
router.get("/profile", verifyToken, isAdmin, getAdminProfile);
router.put("/profile", verifyToken, isAdmin, updateAdminProfile);

module.exports = router;
