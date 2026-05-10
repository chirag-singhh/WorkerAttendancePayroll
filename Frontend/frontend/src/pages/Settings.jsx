import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaUser, FaSave } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const { user } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [locationData, setLocationData] = useState({
    name: "",
    address: "",
  });

  useEffect(() => {
    if (activeTab === "locations") {
      fetchLocations();
    }
  }, [activeTab]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/locations");
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    // Profile update would require backend endpoint
    toast.info("Profile update feature coming soon");
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation._id}`, locationData);
        toast.success("Location updated successfully");
      } else {
        await api.post("/locations", locationData);
        toast.success("Location added successfully");
      }

      setShowLocationModal(false);
      setEditingLocation(null);
      resetLocationForm();
      fetchLocations();
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error(error.response?.data?.message || "Failed to save location");
    }
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationData({
      name: location.name,
      address: location.address,
    });
    setShowLocationModal(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;

    try {
      await api.delete(`/locations/${locationId}`);
      toast.success("Location deleted successfully");
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const resetLocationForm = () => {
    setLocationData({
      name: "",
      address: "",
    });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "locations", label: "Locations", icon: FaMapMarkerAlt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  <FaSave className="mr-2" />
                  Update Profile
                </button>
              </form>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === "locations" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Manage Locations</h2>
                <button
                  onClick={() => {
                    setEditingLocation(null);
                    resetLocationForm();
                    setShowLocationModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add Location
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.length === 0 ? (
                    <div className="text-center py-8">
                      <FaMapMarkerAlt className="text-gray-400 text-4xl mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No locations found</p>
                      <button
                        onClick={() => setShowLocationModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Add Your First Location
                      </button>
                    </div>
                  ) : (
                    locations.map((location) => (
                      <div key={location._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{location.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">{location.address}</p>
                            <p className="text-gray-400 text-xs mt-2">
                              Created: {new Date(location.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditLocation(location)}
                              className="text-blue-600 hover:text-blue-900 p-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location._id)}
                              className="text-red-600 hover:text-red-900 p-2"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingLocation ? "Edit Location" : "Add Location"}
            </h2>

            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={locationData.name}
                  onChange={(e) => setLocationData({...locationData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={locationData.address}
                  onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    setEditingLocation(null);
                    resetLocationForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingLocation ? "Update" : "Add"} Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
