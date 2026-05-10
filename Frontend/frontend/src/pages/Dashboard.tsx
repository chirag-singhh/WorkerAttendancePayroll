import { useState, useEffect } from "react";
import { FaUsers, FaCalendarCheck, FaClock, FaRupeeSign, FaPlus, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

function Dashboard() {
  const [stats, setStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    todayAttendance: 0,
    totalShifts: 0,
    monthlyRevenue: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch workers
      const workersRes = await api.get("/workers");
      const workers = workersRes.data.workers || [];

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await api.get(`/attendance?startDate=${today}&endDate=${today}`);
      const attendance = attendanceRes.data.attendance || [];

      // Calculate stats
      const activeWorkers = workers.filter(w => w.active).length;
      const todayAttendanceCount = attendance.reduce((sum, att) => sum + att.attendance.length, 0);
      const totalShifts = attendance.reduce((sum, att) => sum + att.totalShift, 0);
      const monthlyRevenue = attendance.reduce((sum, att) => sum + att.totalAmount, 0);

      setStats({
        totalWorkers: workers.length,
        activeWorkers,
        todayAttendance: todayAttendanceCount,
        totalShifts,
        monthlyRevenue,
      });

      // Get recent attendance (last 5)
      const recent = attendance.slice(0, 5);
      setRecentAttendance(recent);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your workers today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUsers className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <FaUsers className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeWorkers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <FaCalendarCheck className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaClock className="text-orange-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalShifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <FaRupeeSign className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
          <Link
            to="/reports"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            View Reports
          </Link>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
          <Link
            to="/attendance"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>

        {recentAttendance.length === 0 ? (
          <div className="text-center py-8">
            <FaCalendarCheck className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500">No attendance records found</p>
            <Link
              to="/attendance"
              className="inline-flex items-center mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <FaPlus className="mr-2" />
              Add Attendance
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAttendance.map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{record.workerId?.name}</p>
                  <p className="text-sm text-gray-600">{record.workerId?.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{record.totalShift} shifts</p>
                  <p className="text-sm text-gray-600">₹{record.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/workers"
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus className="mr-2" />
            Add Worker
          </Link>
          <Link
            to="/attendance"
            className="flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
          >
            <FaCalendarCheck className="mr-2" />
            Mark Attendance
          </Link>
          <Link
            to="/reports"
            className="flex items-center justify-center bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            <FaEye className="mr-2" />
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
