import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, MapPin, Phone, Mail, User, FileText, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AppointmentReceipt from "./AppointmentReceipt";

const API_URL = import.meta.env.VITE_API_URL;

const OfflineAppointmentModal = ({ open, onClose, doctor, user }) => {
  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredTimeSlot: "",
    alternateDate: "",
    alternateTimeSlot: "",
    reasonForVisit: "",
    symptoms: [],
    urgencyLevel: "normal",
    contactNumber: "",
    alternateContactNumber: "",
    additionalNotes: "",
    transportationMode: "",
    accompaniedBy: ""
  });
  
  const [symptomsInput, setSymptomsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [bookedAppointmentData, setBookedAppointmentData] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        preferredDate: "",
        preferredTimeSlot: "",
        alternateDate: "",
        alternateTimeSlot: "",
        reasonForVisit: "",
        symptoms: [],
        urgencyLevel: "normal",
        contactNumber: "",
        alternateContactNumber: "",
        additionalNotes: "",
        transportationMode: "",
        accompaniedBy: ""
      });
      setSymptomsInput("");
    }
  }, [open]);

  // Time slots for clinic visits
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

  const urgencyLevels = [
    { value: "low", label: "Low Priority", description: "Can wait a few weeks" },
    { value: "normal", label: "Normal", description: "Within a week" },
    { value: "high", label: "High Priority", description: "Within 2-3 days" },
    { value: "urgent", label: "Urgent", description: "Within 24 hours" }
  ];

  const transportationModes = [
    "Private Vehicle", "Public Transport", "Auto/Taxi", "Walking", "Bicycle", "Others"
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSymptom = () => {
    if (symptomsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomsInput.trim()]
      }));
      setSymptomsInput("");
    }
  };

  const handleRemoveSymptom = (index) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSymptom();
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.preferredDate || !formData.preferredTimeSlot || !formData.reasonForVisit || !formData.contactNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      const appointmentData = {
        doctorId: doctor._id,
        patientId: user.id,
        appointmentType: "offline",
        preferredDate: formData.preferredDate,
        preferredTimeSlot: formData.preferredTimeSlot,
        alternateDate: formData.alternateDate,
        alternateTimeSlot: formData.alternateTimeSlot,
        reasonForVisit: formData.reasonForVisit,
        symptoms: formData.symptoms,
        urgencyLevel: formData.urgencyLevel,
        contactNumber: formData.contactNumber,
        alternateContactNumber: formData.alternateContactNumber,
        additionalNotes: formData.additionalNotes,
        transportationMode: formData.transportationMode,
        accompaniedBy: formData.accompaniedBy,
        status: "pending_confirmation"
      };

      const response = await fetch(`${API_URL}/api/appointments/book-offline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token || localStorage.getItem("token")}`,
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (data.success) {
        // Store the appointment data with a reference number
        const appointmentWithRef = {
          ...appointmentData,
          referenceNumber: `HLX-APT-${Date.now().toString().slice(-8)}`,
          bookedAt: new Date().toISOString()
        };
        
        setBookedAppointmentData(appointmentWithRef);
        toast.success("Offline appointment request submitted successfully! The doctor's clinic will contact you to confirm.");
        onClose(); // Close the booking modal first
        
        // Show receipt after a brief delay
        setTimeout(() => {
          setShowReceipt(true);
        }, 300);
      } else {
        toast.error(data.message || "Failed to submit appointment request");
      }
    } catch (error) {
      console.error("Error submitting offline appointment:", error);
      toast.error("Failed to submit appointment request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return null;

  return (
    <>
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal Panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-background rounded-xl shadow-2xl max-w-4xl w-full p-0 z-50 overflow-y-auto max-h-[90vh]">
          <div className="relative">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <Dialog.Title className="text-2xl font-bold mb-2 text-foreground">
                Book In-Person Appointment
              </Dialog.Title>
              <p className="text-muted-foreground mb-6">
                Schedule a visit to Dr. {doctor.firstName} {doctor.lastName}'s clinic
              </p>

              {/* Doctor & Clinic Info */}
              <Card className="mb-6 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      {doctor.profilePicture ? (
                        <img 
                          src={doctor.profilePicture} 
                          alt={`Dr. ${doctor.firstName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-primary">
                          {doctor.firstName[0]}{doctor.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-primary font-medium mb-2">
                        {doctor.specializations?.join(", ") || "General Practitioner"}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Clinic: {doctor.address?.street || "Contact clinic for address"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>Ph: {doctor.contactNumber || "Contact via platform"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Fee: ₹{doctor.consultationFee}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{doctor.yearsOfExperience} years experience</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Preferred Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preferred Time Slot *
                    </label>
                    <select
                      value={formData.preferredTimeSlot}
                      onChange={(e) => handleInputChange('preferredTimeSlot', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Select time slot</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* Alternate Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alternate Date (Optional)
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.alternateDate}
                      onChange={(e) => handleInputChange('alternateDate', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alternate Time Slot (Optional)
                    </label>
                    <select
                      value={formData.alternateTimeSlot}
                      onChange={(e) => handleInputChange('alternateTimeSlot', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="">Select alternate time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      maxLength="10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Alternate Contact (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="Backup contact number"
                      value={formData.alternateContactNumber}
                      onChange={(e) => handleInputChange('alternateContactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      maxLength="10"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reason for Visit *
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Brief description of your concern..."
                      value={formData.reasonForVisit}
                      onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
                      required
                    />
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Symptoms (Optional)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add symptom and press Enter or comma"
                        value={symptomsInput}
                        onChange={(e) => setSymptomsInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSymptom}
                        variant="outline"
                        size="sm"
                        className="px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      <AnimatePresence>
                        {formData.symptoms.map((symptom, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {symptom}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveSymptom(index)}
                              />
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {urgencyLevels.map(level => (
                        <div
                          key={level.value}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.urgencyLevel === level.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleInputChange('urgencyLevel', level.value)}
                        >
                          <div className="text-sm font-medium text-foreground">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transportation */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Transportation Mode (Optional)
                    </label>
                    <select
                      value={formData.transportationMode}
                      onChange={(e) => handleInputChange('transportationMode', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="">Select transportation</option>
                      {transportationModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  {/* Accompanied By */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Accompanied By (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Family member, Friend"
                      value={formData.accompaniedBy}
                      onChange={(e) => handleInputChange('accompaniedBy', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Any special requirements, medical history, or additional information..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none"
                />
              </div>

              {/* Important Notice */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Notice:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• This is an appointment request. The clinic will contact you to confirm.</li>
                  <li>• Please arrive 15 minutes before your scheduled time.</li>
                  <li>• Bring a valid ID and any previous medical reports.</li>
                  <li>• Consultation fee: ₹{doctor.consultationFee} (to be paid at the clinic)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.preferredDate || !formData.preferredTimeSlot || !formData.reasonForVisit || !formData.contactNumber}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Appointment Request"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>

    {/* Appointment Receipt Modal - Outside parent Dialog */}
    {showReceipt && bookedAppointmentData && (
      <AppointmentReceipt
        open={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setBookedAppointmentData(null);
        }}
        appointmentData={bookedAppointmentData}
        doctor={doctor}
        patient={user}
      />
    )}
    </>
  );
};

export default OfflineAppointmentModal;