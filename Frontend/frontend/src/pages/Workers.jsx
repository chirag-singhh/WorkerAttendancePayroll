import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSearch, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import api from "../services/api";
import toast from "react-hot-toast";

function Workers() {
  const [workers, setWorkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    department: "Mistry",
    customDepartment: "",
    memberId: "",
    rate: "",
    phone: "",
    locationId: "",
  });

  const departments = [
    "Mistry",
    "Carpenter",
    "Assistant",
    "Painter",
    "Extra",
    "Tiles",
    "Rustom",
    "Molder",
    "Custom",
  ];

  useEffect(() => {
    fetchWorkers();
    fetchLocations();
  }, []);

  const fetchWorkers = async () => {
    try {
      const res = await api.get("/workers");
      setWorkers(res.data.workers || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get("/locations");
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.department === "Custom" && !formData.customDepartment.trim()) {
      toast.error("Please enter custom department name");
      return;
    }

    try {
      const submitData = {
        ...formData,
        department: formData.department === "Custom" ? formData.customDepartment : formData.department,
        rate: parseFloat(formData.rate),
      };

      if (editingWorker) {
        await api.put(`/workers/${editingWorker._id}`, submitData);
        toast.success("Worker updated successfully");
      } else {
        await api.post("/workers", submitData);
        toast.success("Worker added successfully");
      }

      setShowModal(false);
      setEditingWorker(null);
      resetForm();
      fetchWorkers();
    } catch (error) {
      console.error("Error saving worker:", error);
      toast.error(error.response?.data?.message || "Failed to save worker");
    }
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      department: departments.includes(worker.department) ? worker.department : "Custom",
      customDepartment: departments.includes(worker.department) ? "" : worker.department,
      memberId: worker.memberId,
      rate: worker.rate.toString(),
      phone: worker.phone || "",
      locationId: worker.locationId?._id || worker.locationId || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (workerId) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) return;

    try {
      await api.delete(`/workers/${workerId}`);
      toast.success("Worker deleted successfully");
      fetchWorkers();
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast.error("Failed to delete worker");
    }
  };

  const handleToggleStatus = async (workerId) => {
    try {
      await api.patch(`/workers/toggle-status/${workerId}`);
      toast.success("Worker status updated");
      fetchWorkers();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      department: "Mistry",
      customDepartment: "",
      memberId: "",
      rate: "",
      phone: "",
      locationId: "",
    });
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.department.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-600">Manage your workforce</p>
        </div>
        <button
          onClick={() => {
            setEditingWorker(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Worker
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
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

      {/* Workers List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <FaPlus className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No workers found</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Worker
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
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkers.map((worker) => (
                  <tr key={worker._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          {worker.phone && (
                            <>
                              <FaPhone className="mr-1" />
                              {worker.phone}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{worker.department}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{worker.memberId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">₹{worker.rate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        worker.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {worker.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(worker)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(worker._id)}
                        className={worker.active ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                      >
                        {worker.active ? <FaToggleOff /> : <FaToggleOn />}
                      </button>
                      <button
                        onClick={() => handleDelete(worker._id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingWorker ? "Edit Worker" : "Add Worker"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {formData.department === "Custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Department *
                  </label>
                  <input
                    type="text"
                    value={formData.customDepartment}
                    onChange={(e) => setFormData({...formData, customDepartment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member ID *
                </label>
                <input
                  type="text"
                  value={formData.memberId}
                  onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate per Shift (₹) *
                </label>
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingWorker(null);
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
                  {editingWorker ? "Update" : "Add"} Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workers;
