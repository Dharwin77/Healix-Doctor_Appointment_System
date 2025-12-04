const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      required: true,
    },
    permissions: {
      manageUsers: { type: Boolean, default: true },
      manageDoctors: { type: Boolean, default: true },
      managePatients: { type: Boolean, default: true },
      manageAppointments: { type: Boolean, default: true },
      viewAnalytics: { type: Boolean, default: true },
      manageSettings: { type: Boolean, default: true },
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

adminSchema.index({ email: 1 });
adminSchema.index({ firebaseUid: 1 });

module.exports = mongoose.model("Admin", adminSchema);
