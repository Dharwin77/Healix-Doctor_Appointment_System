const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Admin = require("../models/admin");
const Appointment = require("../models/appointment");
const Chat = require("../models/chat");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalAppointments, activeChats] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Chat.countDocuments({ status: { $in: ['active', 'waiting'] } })
    ]);

    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email specializations');

    // Get monthly registration trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newPatientsThisMonth, newDoctorsThisMonth] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Doctor.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    res.status(200).json({
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        activeChats,
        newPatientsThisMonth,
        newDoctorsThisMonth
      },
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentAppointments
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get all doctors with pagination and filters
const getAllDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", specialization = "" } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Doctor.countDocuments(query);

    res.status(200).json({
      doctors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      message: "Failed to fetch doctors",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get all patients with pagination and filters
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Patient.countDocuments(query);

    res.status(200).json({
      patients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      message: "Failed to fetch patients",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get all appointments with pagination and filters
const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", doctorId = "", patientId = "" } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (patientId) {
      query.patientId = patientId;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName email profilePicture')
      .populate('doctorId', 'firstName lastName email specializations profilePicture')
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: -1 });

    const count = await Appointment.countDocuments(query);

    res.status(200).json({
      appointments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      message: "Failed to fetch appointments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Delete a user (patient or doctor)
const deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;

    if (!['patient', 'doctor'].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    let user;
    if (userType === 'patient') {
      user = await Patient.findByIdAndDelete(userId);
      
      // Delete associated appointments
      if (user) {
        await Appointment.deleteMany({ patientId: userId });
      }
    } else if (userType === 'doctor') {
      user = await Doctor.findByIdAndDelete(userId);
      
      // Delete associated appointments and availability
      if (user) {
        await Appointment.deleteMany({ doctorId: userId });
        // Also delete doctor availability if you have that model
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully`,
      deletedUser: user
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName email specializations');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json({
      message: "Appointment status updated successfully",
      appointment
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      message: "Failed to update appointment status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get system analytics
const getSystemAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get registration trends
    const patientRegistrations = await Patient.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const doctorRegistrations = await Doctor.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get appointment trends
    const appointmentTrends = await Appointment.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Get specialization distribution
    const specializationDistribution = await Doctor.aggregate([
      {
        $group: {
          _id: "$specialization",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      patientRegistrations,
      doctorRegistrations,
      appointmentTrends,
      specializationDistribution,
      timeRange
    });
  } catch (error) {
    console.error("Error fetching system analytics:", error);
    res.status(500).json({
      message: "Failed to fetch system analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await Admin.findById(adminId).select('-__v');

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ admin });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      message: "Failed to fetch admin profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { firstName, lastName, email, phoneNumber, profilePicture } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      admin
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({
      message: "Failed to update admin profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllDoctors,
  getAllPatients,
  getAllAppointments,
  deleteUser,
  updateAppointmentStatus,
  getSystemAnalytics,
  getAdminProfile,
  updateAdminProfile
};
