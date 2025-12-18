import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FaSearch, 
  FaUserMd, 
  FaStar, 
  FaMapMarkerAlt, 
  FaClock,
  FaComments,
  FaPhone,
  FaEnvelope 
} from 'react-icons/fa';
import { toast } from 'sonner';

const DoctorSearch = ({ onStartChat }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchTerm, specializationFilter, doctors]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/doctors');
      setDoctors(response.data);
      setFilteredDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors');
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specializationFilter) {
      filtered = filtered.filter(doctor => 
        doctor.specialization?.toLowerCase().includes(specializationFilter.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleStartChat = (doctor) => {
    if (onStartChat) {
      onStartChat(doctor);
    }
  };

  const getSpecializations = () => {
    const specializations = [...new Set(doctors.map(doc => doc.specialization).filter(Boolean))];
    return specializations;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <FaUserMd className="text-blue-600 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">Find Doctors</h2>
        </div>
        <p className="text-gray-600">Search and connect with healthcare professionals</p>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, specialization, or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Specialization Filter */}
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {getSpecializations().map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <motion.div
            key={doctor._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={doctor.profilePicture} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {doctor.fullName?.split(' ').map(n => n[0]).join('') || 'DR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      Dr. {doctor.fullName}
                    </CardTitle>
                    {doctor.specialization && (
                      <Badge variant="secondary" className="mt-1">
                        {doctor.specialization}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Hospital */}
                {doctor.hospital && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span className="truncate">{doctor.hospital}</span>
                  </div>
                )}

                {/* Experience */}
                {doctor.experience && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FaClock className="text-gray-400" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                )}

                {/* Rating */}
                {doctor.rating && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FaStar className="text-yellow-400" />
                    <span>{doctor.rating}/5.0</span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  {doctor.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FaEnvelope className="text-gray-400" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FaPhone className="text-gray-400" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleStartChat(doctor)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <FaComments className="mr-2 h-4 w-4" />
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredDoctors.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <FaUserMd className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorSearch;