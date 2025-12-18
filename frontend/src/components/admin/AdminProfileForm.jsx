import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaSave, FaUser } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminProfileForm = ({ adminProfile, setAdminProfile }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    profilePicture: "",
  });

  useEffect(() => {
    if (adminProfile) {
      setFormData({
        firstName: adminProfile.firstName || adminProfile.name?.split(" ")[0] || "",
        lastName: adminProfile.lastName || adminProfile.name?.split(" ").slice(1).join(" ") || "",
        email: adminProfile.email || "",
        phoneNumber: adminProfile.phoneNumber || "",
        profilePicture: adminProfile.profilePicture || "",
      });
    }
  }, [adminProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/admin/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAdminProfile(response.data.admin);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const displayPicture = formData.profilePicture || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${formData.firstName} ${formData.lastName}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FaUser className="h-5 w-5" />
            <span>Admin Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayPicture} />
                <AvatarFallback className="text-2xl font-semibold">
                  {(formData.firstName?.[0] || "") + (formData.lastName?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="profilePicture">Profile Picture URL</Label>
                <Input
                  id="profilePicture"
                  name="profilePicture"
                  type="url"
                  value={formData.profilePicture}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            {/* Admin Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role:</span>
                    <span className="text-sm text-primary font-semibold">Administrator</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm text-green-600 font-semibold">Active</span>
                  </div>
                  {adminProfile?.lastLogin && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Login:</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(adminProfile.lastLogin).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="flex items-center space-x-2">
                <FaSave className="h-4 w-4" />
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileForm;
