const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true, 
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed","ongoing", "cancelled", "pending_confirmation", "confirmed"],
      default: "pending",
    },
    appointmentType: {
      type: String,
      enum: ["consultation", "follow-up", "emergency", "online", "offline"],
      default: "consultation",
    },
    notes: {
      type: String,
      default: "",
    },
    fee: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: "",
    },
    reasonForVisit: {
      type: String,
      required: true,
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    prescription: {
      type: String,
      default: "",
    },
    roomUrl: {
      type: String,
      default: "",
    },
    symptoms: {
      type: [String],
      default: [],
    },
    diagnosis: {
      type: String,
      default: "",
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    
    // Offline appointment specific fields
    preferredDate: {
      type: Date,
    },
    preferredTimeSlot: {
      type: String,
    },
    alternateDate: {
      type: Date,
    },
    alternateTimeSlot: {
      type: String,
    },
    urgencyLevel: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    contactNumber: {
      type: String,
    },
    alternateContactNumber: {
      type: String,
    },
    additionalNotes: {
      type: String,
    },
    transportationMode: {
      type: String,
    },
    accompaniedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
