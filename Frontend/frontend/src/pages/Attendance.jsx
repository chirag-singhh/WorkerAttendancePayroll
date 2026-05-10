import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaSearch } from "react-icons/fa";
import dayjs from "dayjs";
import api from "../services/api";
import toast from "react-hot-toast";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
  });
  const [formData, setFormData] = useState({
    workerId: "",
    locationId: "",
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    attendance: [],
  });

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await api.get(`/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setAttendance(res.data.attendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await api.get("/workers");
      setWorkers(res.data.workers || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await api.get("/locations");
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAttendance();
    };
    loadData();
  }, [fetchAttendance]);

  useEffect(() => {
    fetchWorkers();
    fetchLocations();
  }, [fetchWorkers, fetchLocations]);

  const generateAttendanceDates = (startDate, endDate) => {
    const dates = [];
    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      dates.push({
        date: currentDate.format('YYYY-MM-DD'),
        shift: 1, // Default to 1 shift
      });
      currentDate = currentDate.add(1, 'day');
    }

    return dates;
  };

  const handleWorkerChange = (workerId) => {
    const worker = workers.find(w => w._id === workerId);
    if (worker) {
      setFormData({
        ...formData,
        workerId,
        locationId: worker.locationId?._id || worker.locationId || "",
        attendance: generateAttendanceDates(formData.startDate, formData.endDate),
      });
    }
  };

  const handleDateChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    if (newFormData.startDate && newFormData.endDate && newFormData.workerId) {
      newFormData.attendance = generateAttendanceDates(newFormData.startDate, newFormData.endDate);
    }

    setFormData(newFormData);
  };

  const handleShiftChange = (dateIndex, shift) => {
    const newAttendance = [...formData.attendance];
    newAttendance[dateIndex].shift = parseInt(shift) || 0;
    setFormData({ ...formData, attendance: newAttendance });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.workerId || !formData.locationId) {
      toast.error("Please select worker and location");
      return;
    }

    try {
      const submitData = {
        ...formData,
        attendance: formData.attendance.filter(att => att.shift > 0), // Only include days with shifts
      };

      if (editingAttendance) {
        await api.put(`/attendance/${editingAttendance._id}`, submitData);
        toast.success("Attendance updated successfully");
      } else {
        await api.post("/attendance", submitData);
        toast.success("Attendance added successfully");
      }

      setShowModal(false);
      setEditingAttendance(null);
      resetForm();
      fetchAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(error.response?.data?.message || "Failed to save attendance");
    }
  };

  const handleEdit = (att) => {
    setEditingAttendance(att);
    setFormData({
      workerId: att.workerId._id,
      locationId: att.locationId._id,
      startDate: dayjs(att.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(att.endDate).format('YYYY-MM-DD'),
      attendance: att.attendance,
    });
    setShowModal(true);
  };

  const handleDelete = async (attendanceId) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;

    try {
      await api.delete(`/attendance/${attendanceId}`);
      toast.success("Attendance deleted successfully");
      fetchAttendance();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      toast.error("Failed to delete attendance");
    }
  };

  const resetForm = () => {
    setFormData({
      workerId: "",
      locationId: "",
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
      attendance: [],
    });
  };

  const filteredAttendance = attendance.filter(att =>
    att.workerId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    att.workerId?.memberId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Manage worker attendance records</p>
        </div>
        <button
          onClick={() => {
            setEditingAttendance(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Attendance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredAttendance.length === 0 ? (
          <div className="text-center py-12">
            <FaCalendarAlt className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No attendance records found</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Attendance Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Shifts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((att) => (
                  <tr key={att._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{att.workerId?.name}</div>
                        <div className="text-sm text-gray-500">{att.workerId?.memberId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dayjs(att.startDate).format('MMM DD')} - {dayjs(att.endDate).format('MMM DD, YYYY')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{att.totalShift}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">₹{att.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(att)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(att._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingAttendance ? "Edit Attendance" : "Add Attendance"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Worker *
                  </label>
                  <select
                    value={formData.workerId}
                    onChange={(e) => handleWorkerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Worker</option>
                    {workers.filter(w => w.active).map(worker => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} ({worker.memberId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location._id} value={location._id}>
                        {location.name} - {location.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Attendance Grid */}
              {formData.attendance.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Shifts
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {formData.attendance.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <span className="text-sm">{dayjs(day.date).format('MMM DD')}</span>
                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={day.shift}
                          onChange={(e) => handleShiftChange(index, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAttendance(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingAttendance ? "Update" : "Add"} Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
