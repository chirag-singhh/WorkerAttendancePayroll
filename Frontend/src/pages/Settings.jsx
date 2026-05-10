import { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiLocationMarker } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { locationService } from '../services/locationService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, locations, fetchLocations } = useAuth();
  const [showLocModal, setShowLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditLoc(null);
    setForm({ name: '', address: '' });
    setShowLocModal(true);
  };

  const openEdit = (loc) => {
    setEditLoc(loc);
    setForm({ name: loc.name, address: loc.address || '' });
    setShowLocModal(true);
  };

  const handleSaveLoc = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      if (editLoc) {
        await locationService.update(editLoc._id, form);
        toast.success('Location updated');
      } else {
        await locationService.create(form);
        toast.success('Location added');
      }
      setShowLocModal(false);
      fetchLocations();
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLoc = async (id) => {
    if (!window.confirm('Delete this location? This might affect associated workers.')) return;
    try {
      await locationService.delete(id);
      toast.success('Location deleted');
      fetchLocations();
    } catch {
      toast.error('Failed to delete location');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Profile Information</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <h2 className="text-base font-semibold text-gray-800">Manage Locations</h2>
          <Button size="sm" onClick={openAdd} className="gap-1 px-3 py-1.5">
            <HiPlus className="w-4 h-4" /> Add
          </Button>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No locations added yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {locations.map((loc) => (
              <div key={loc._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <HiLocationMarker className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{loc.name}</p>
                    {loc.address && <p className="text-xs text-gray-500 truncate">{loc.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(loc)} className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-50">
                    <HiPencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteLoc(loc._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={showLocModal}
        onClose={() => setShowLocModal(false)}
        title={editLoc ? 'Edit Location' : 'Add Location'}
        size="sm"
      >
        <form onSubmit={handleSaveLoc} className="space-y-4">
          <Input
            label="Location Name *"
            placeholder="e.g. Site A"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            placeholder="e.g. 123 Main St"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowLocModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
