import React from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Video, MapPin, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const AppointmentTypeModal = ({ open, onClose, doctor, onSelectType }) => {
  if (!doctor) return null;

  const appointmentTypes = [
    {
      id: 'online',
      title: 'Online Consultation',
      subtitle: 'Video appointment from your home',
      icon: Video,
      description: 'Join a secure video call with the doctor from the comfort of your home',
      features: [
        'Video consultation via Digital Samba',
        'Screen sharing capabilities',
        'Secure and private',
        'No travel required',
        'Digital prescription'
      ],
      duration: '30-45 minutes',
      availability: 'Available today'
    },
    {
      id: 'offline',
      title: 'In-Person Visit',
      subtitle: 'Visit doctor at their clinic',
      icon: MapPin,
      description: 'Meet the doctor in person at their clinic for physical examination',
      features: [
        'Physical examination',
        'Direct consultation',
        'Medical tests if needed',
        'Traditional appointment',
        'Paper/Digital prescription'
      ],
      duration: '20-30 minutes',
      availability: 'Check clinic timings'
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

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
                Choose Appointment Type
              </Dialog.Title>
              <p className="text-muted-foreground mb-6">
                Book an appointment with Dr. {doctor.firstName} {doctor.lastName}
              </p>

              {/* Doctor Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
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
                    <p className="text-primary font-medium">
                      {doctor.specializations?.join(", ") || "General Practitioner"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doctor.yearsOfExperience} years experience • ₹{doctor.consultationFee}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Type Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointmentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="cursor-pointer border-2 hover:border-primary/50 transition-all duration-200 h-full"
                        onClick={() => onSelectType(type.id)}
                      >
                        <CardContent className="p-6 h-full flex flex-col">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              type.id === 'online' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">
                                {type.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {type.subtitle}
                              </p>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-4 flex-grow">
                            {type.description}
                          </p>

                          {/* Features */}
                          <div className="space-y-2 mb-4">
                            {type.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* Duration & Availability */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{type.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{type.availability}</span>
                            </div>
                          </div>

                          {/* Select Button */}
                          <Button 
                            className={`w-full ${
                              type.id === 'online' 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            Select {type.title}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Both appointment types include consultation with Dr. {doctor.firstName} {doctor.lastName}. 
                  Online consultations are available immediately while in-person visits depend on clinic availability.
                </p>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AppointmentTypeModal;