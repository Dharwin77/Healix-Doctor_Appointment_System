import React, { useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Calendar, Clock, MapPin, User, Phone, FileText, CheckCircle2, Printer } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from "sonner";
import '../../../styles/print.css';

const AppointmentReceipt = ({ open, onClose, appointmentData, doctor, patient }) => {
  const receiptRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Debug logging
  React.useEffect(() => {
    if (open) {
      console.log('Receipt Data:', { appointmentData, doctor, patient });
    }
  }, [open, appointmentData, doctor, patient]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // Convert 24h format to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleDownloadPDF = async () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) {
      toast.error("Receipt not found. Please try again.");
      return;
    }

    setIsGeneratingPDF(true);
    toast.info("Generating PDF...");

    try {
      // Wait for animations and rendering
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Starting PDF generation...');
      console.log('Element to capture:', receiptElement);

      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        removeContainer: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-print-receipt]');
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.position = 'relative';
            clonedElement.style.overflow = 'visible';
            clonedElement.style.height = 'auto';
          }
        }
      });

      console.log('Canvas created:', canvas.width, 'x', canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions');
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight, 'Page height:', pageHeight);

      // Add content to PDF with multiple pages if needed
      if (pdfHeight > pageHeight) {
        let heightLeft = pdfHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Add remaining pages
        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      const fileName = `Healix-Appointment-Receipt-${appointmentData?.referenceNumber || Date.now()}.pdf`;
      pdf.save(fileName);
      console.log('PDF saved successfully:', fileName);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error("Failed to generate PDF. Please try again or use Print instead.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!appointmentData || !doctor) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4">
          <Dialog.Panel className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            {/* Action Buttons - Top */}
            <div className="sticky top-0 bg-white z-10 border-b p-4 rounded-t-xl flex justify-between items-center print:hidden">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                Appointment Receipt
              </Dialog.Title>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      PDF
                    </>
                  )}
                </Button>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Receipt Content - Full pages */}
            <div ref={receiptRef} data-print-receipt className="bg-white p-8 space-y-6">
            {/* Header with Logo and Platform Name */}
            <div className="text-center border-b pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-white">H+</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Healix</h1>
                <p className="text-sm text-gray-600">Smart Medical Appointments Platform</p>
                <p className="text-xs text-gray-500 mt-1">with Real-Time Chat Assistant</p>
              </motion.div>
            </div>

            {/* Success Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800">Appointment Request Submitted Successfully!</h3>
                <p className="text-sm text-green-700 mt-1">
                  {appointmentData.appointmentType === 'offline' 
                    ? 'The clinic will contact you shortly to confirm your appointment.'
                    : 'Your appointment has been confirmed.'}
                </p>
              </div>
            </motion.div>

            {/* Reference Number */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 font-medium">Booking Reference Number</div>
              <div className="text-2xl font-bold text-blue-900 mt-1 tracking-wide">
                {appointmentData.referenceNumber || `HLX-${Date.now().toString().slice(-8)}`}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Booked on: {formatDate(new Date())} at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Doctor Details */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Doctor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Doctor Name</div>
                    <div className="font-semibold text-gray-800">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Specialization</div>
                    <div className="font-semibold text-gray-800">
                      {doctor.specializations?.join(", ") || "General Practitioner"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className="font-semibold text-gray-800">
                      {doctor.yearsOfExperience} years
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Consultation Fee</div>
                    <div className="font-semibold text-green-700">
                      ₹{doctor.consultationFee}
                    </div>
                  </div>
                </div>
                {doctor.address && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Clinic/Hospital Address
                    </div>
                    <div className="text-gray-800">
                      {doctor.address.street}, {doctor.address.city}, {doctor.address.state} - {doctor.address.zipCode}
                    </div>
                    {doctor.contactNumber && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">Clinic Phone:</span>
                        <span className="text-gray-800">{doctor.contactNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Details */}
            {patient && (
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Patient Name</div>
                      <div className="font-semibold text-gray-800">
                        {patient.name || patient.firstName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'N/A'}
                      </div>
                    </div>
                    {patient.email && (
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-semibold text-gray-800">
                          {patient.email}
                        </div>
                      </div>
                    )}
                    {patient.phone && (
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-semibold text-gray-800">
                          {patient.phone}
                        </div>
                      </div>
                    )}
                    {patient.dateOfBirth && (
                      <div>
                        <div className="text-sm text-gray-600">Date of Birth</div>
                        <div className="font-semibold text-gray-800">
                          {formatDate(patient.dateOfBirth)}
                        </div>
                      </div>
                    )}
                    {patient.gender && (
                      <div>
                        <div className="text-sm text-gray-600">Gender</div>
                        <div className="font-semibold text-gray-800 capitalize">
                          {patient.gender}
                        </div>
                      </div>
                    )}
                    {patient.bloodGroup && (
                      <div>
                        <div className="text-sm text-gray-600">Blood Group</div>
                        <div className="font-semibold text-red-600">
                          {patient.bloodGroup}
                        </div>
                      </div>
                    )}
                  </div>
                  {patient.address && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Patient Address
                      </div>
                      <div className="text-gray-800">
                        {typeof patient.address === 'string' 
                          ? patient.address 
                          : `${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''} - ${patient.address.zipCode || ''}`.replace(/,\s*,/g, ',').trim()
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appointment Details */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Appointment Type</div>
                    <div className="font-semibold text-gray-800 capitalize">
                      {appointmentData.appointmentType || 'Offline'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-semibold text-orange-600 capitalize">
                      {appointmentData.status === 'pending_confirmation' ? 'Pending Confirmation' : appointmentData.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Preferred Date
                    </div>
                    <div className="font-semibold text-gray-800">
                      {formatDate(appointmentData.preferredDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Preferred Time
                    </div>
                    <div className="font-semibold text-gray-800">
                      {formatTime(appointmentData.preferredTimeSlot)}
                    </div>
                  </div>
                  {appointmentData.alternateDate && (
                    <>
                      <div>
                        <div className="text-sm text-gray-600">Alternate Date</div>
                        <div className="font-semibold text-gray-800">
                          {formatDate(appointmentData.alternateDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Alternate Time</div>
                        <div className="font-semibold text-gray-800">
                          {formatTime(appointmentData.alternateTimeSlot)}
                        </div>
                      </div>
                    </>
                  )}
                  {appointmentData.urgencyLevel && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Urgency Level</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyBadgeColor(appointmentData.urgencyLevel)}`}>
                        {appointmentData.urgencyLevel.charAt(0).toUpperCase() + appointmentData.urgencyLevel.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patient Contact & Visit Details */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact & Visit Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Contact Number</div>
                    <div className="font-semibold text-gray-800">
                      {appointmentData.contactNumber}
                    </div>
                  </div>
                  {appointmentData.alternateContactNumber && (
                    <div>
                      <div className="text-sm text-gray-600">Alternate Contact</div>
                      <div className="font-semibold text-gray-800">
                        {appointmentData.alternateContactNumber}
                      </div>
                    </div>
                  )}
                  {appointmentData.reasonForVisit && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Reason for Visit
                      </div>
                      <div className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {appointmentData.reasonForVisit}
                      </div>
                    </div>
                  )}
                  {appointmentData.symptoms && appointmentData.symptoms.length > 0 && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 mb-2">Symptoms</div>
                      <div className="flex flex-wrap gap-2">
                        {appointmentData.symptoms.map((symptom, index) => (
                          <span key={index} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {appointmentData.transportationMode && (
                    <div>
                      <div className="text-sm text-gray-600">Transportation</div>
                      <div className="font-semibold text-gray-800">
                        {appointmentData.transportationMode}
                      </div>
                    </div>
                  )}
                  {appointmentData.accompaniedBy && (
                    <div>
                      <div className="text-sm text-gray-600">Accompanied By</div>
                      <div className="font-semibold text-gray-800">
                        {appointmentData.accompaniedBy}
                      </div>
                    </div>
                  )}
                  {appointmentData.additionalNotes && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-gray-600 mb-1">Additional Notes</div>
                      <div className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {appointmentData.additionalNotes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Instructions */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Important Instructions
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 ml-5">
                <li>• Save this receipt for your records</li>
                <li>• The clinic will contact you on {appointmentData.contactNumber} to confirm your appointment</li>
                <li>• Please arrive 15 minutes before your scheduled time</li>
                <li>• Bring a valid ID and any previous medical reports</li>
                <li>• Consultation fee of ₹{doctor.consultationFee} is to be paid at the clinic</li>
                {appointmentData.appointmentType === 'offline' && (
                  <li>• In case of emergency, contact the clinic directly</li>
                )}
              </ul>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t">
              <p className="text-sm text-gray-600">
                For any queries, contact us at <a href="mailto:support@healix.com" className="text-blue-600 hover:underline">support@healix.com</a>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Generated on {formatDate(new Date())} at {new Date().toLocaleTimeString('en-IN')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                © {new Date().getFullYear()} Healix - Smart Medical Appointments Platform. All rights reserved.
              </p>
            </div>
            </div>
            {/* End of Receipt Content */}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default AppointmentReceipt;
