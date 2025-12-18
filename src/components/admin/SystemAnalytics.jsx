import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaChartLine, FaClock } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SystemAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/api/admin/analytics?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FaChartLine className="h-5 w-5" />
              <span>System Analytics</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <FaClock className="text-muted-foreground h-4 w-4" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Trends */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Registration Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Patient Registrations
                  </p>
                  <div className="space-y-2">
                    {analytics?.patientRegistrations?.slice(0, 5).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item._id}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Total:{" "}
                    {analytics?.patientRegistrations?.reduce(
                      (acc, item) => acc + item.count,
                      0
                    ) || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Doctor Registrations
                  </p>
                  <div className="space-y-2">
                    {analytics?.doctorRegistrations?.slice(0, 5).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{item._id}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Total:{" "}
                    {analytics?.doctorRegistrations?.reduce(
                      (acc, item) => acc + item.count,
                      0
                    ) || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Specialization Distribution */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Doctor Specialization Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {analytics?.specializationDistribution?.map((spec) => (
                <Card key={spec._id}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{spec.count}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {spec._id || "N/A"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Appointment Trends */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Appointment Activity</h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {analytics?.appointmentTrends
                    ?.slice(0, 10)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {item._id.date}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground capitalize">
                            ({item._id.status})
                          </span>
                        </div>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAnalytics;
