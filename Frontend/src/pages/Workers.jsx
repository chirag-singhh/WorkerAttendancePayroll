import { useEffect, useState } from 'react';
import {
  HiPlus, HiSearch, HiPencil, HiTrash, HiPhone, HiIdentification,
  HiUsers, HiSwitchHorizontal,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { workerService } from '../services/workerService';
import { DEPARTMENTS } from '../utils/shiftUtils';
import { formatCurrency } from '../utils/dateUtils';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  department: 'Mistry',
  customDepartment: '',
  memberId: '',
  rate: '',
  phone: '',
  locationId: '',
};

function WorkerCard({ worker, onEdit, onDelete, onToggle }) {
  const dept = worker.customDepartment || worker.department;
  const initials = worker.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isActive = worker.active !== false;

  return (
    <div className={`card p-4 transition-all ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{worker.name}</p>
              <span className={`badge text-xs mt-0.5 ${isActive ? 'badge-blue' : 'badge-gray'}`}>
                {dept}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onToggle(worker)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={isActive ? 'Set Inactive' : 'Set Active'}
              >
                <HiSwitchHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit(worker)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <HiPencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(worker)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
              >
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {worker.memberId && (
              <span className="flex items-center gap-1">
                <HiIdentification className="w-3.5 h-3.5" />
                {worker.memberId}
              </span>
            )}
            {worker.phone && (
              <span className="flex items-center gap-1">
                <HiPhone className="w-3.5 h-3.5" />
                {worker.phone}
              </span>
            )}
            {worker.rate && (
              <span className="font-semibold text-gray-700">
                {formatCurrency(worker.rate)}/shift
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Workers() {
  const { activeLocation, locations } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setFilterLocation(activeLocation?._id || '');
  }, [activeLocation]);

  useEffect(() => {
    fetchWorkers();
  }, [filterLocation]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await workerService.getAll(filterLocation || undefined);
      setWorkers(res.data.workers || res.data || []);
    } catch {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditWorker(null);
    setForm({ ...EMPTY_FORM, locationId: activeLocation?._id || '' });
    setShowModal(true);
  };

  const openEdit = (worker) => {
    setEditWorker(worker);
    setForm({
      name: worker.name || '',
      department: DEPARTMENTS.includes(worker.department) ? worker.department : 'Other',
      customDepartment: worker.customDepartment || worker.department || '',
      memberId: worker.memberId || '',
      rate: worker.rate || '',
      phone: worker.phone || '',
      locationId: worker.locationId?._id || worker.locationId || activeLocation?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.rate || !form.locationId) {
      toast.error('Name, rate, and location are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rate: parseFloat(form.rate),
        department: form.department === 'Other' ? '' : form.department,
        customDepartment: form.department === 'Other' ? form.customDepartment : '',
      };
      if (editWorker) {
        await workerService.update(editWorker._id, payload);
        toast.success('Worker updated!');
      } else {
        await workerService.create(payload);
        toast.success('Worker added!');
      }
      setShowModal(false);
      fetchWorkers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await workerService.delete(deleteTarget._id);
      toast.success('Worker deleted');
      setDeleteTarget(null);
      fetchWorkers();
    } catch {
      toast.error('Failed to delete worker');
    }
  };

  const handleToggle = async (worker) => {
    try {
      await workerService.toggleStatus(worker._id);
      toast.success(`Worker ${worker.active !== false ? 'deactivated' : 'activated'}`);
      fetchWorkers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.department?.toLowerCase().includes(search.toLowerCase()) ||
    w.memberId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers.length} total workers</p>
        </div>
        <Button onClick={openAdd} className="gap-1.5">
          <HiPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Worker</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-10 py-2.5"
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input py-2.5 w-auto text-sm"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map(loc => (
            <option key={loc._id} value={loc._id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Workers List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<HiUsers className="w-8 h-8" />}
          title={search ? 'No workers found' : 'No workers yet'}
          description={search ? 'Try a different search term' : 'Add your first worker to get started'}
          action={!search && <Button onClick={openAdd}><HiPlus className="w-4 h-4" />Add Worker</Button>}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Worker</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Member ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rate/Shift</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(worker => {
                    const isActive = worker.active !== false;
                    const initials = worker.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr key={worker._id} className={`hover:bg-gray-50 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                              {initials}
                            </div>
                            <span className="font-medium text-gray-900">{worker.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{worker.customDepartment || worker.department}</td>
                        <td className="px-4 py-3 text-gray-500">{worker.memberId || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{worker.phone || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(worker.rate)}</td>
                        <td className="px-4 py-3">
                          <span className={isActive ? 'badge-green' : 'badge-gray'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleToggle(worker)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title="Toggle status">
                              <HiSwitchHorizontal className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(worker)} className="w-8 h-8 rounded-xl flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors">
                              <HiPencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(worker)} className="w-8 h-8 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map(worker => (
              <WorkerCard
                key={worker._id}
                worker={worker}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editWorker ? 'Edit Worker' : 'Add New Worker'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="Worker name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <label className="label">Department *</label>
            <select
              className="input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {form.department === 'Other' && (
            <Input
              label="Custom Department"
              placeholder="Enter department name"
              value={form.customDepartment}
              onChange={(e) => setForm({ ...form, customDepartment: e.target.value })}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Member ID"
              placeholder="e.g. W001"
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            />
            <Input
              label="Rate / Shift (₹) *"
              type="number"
              min="0"
              placeholder="e.g. 500"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              required
            />
          </div>
          {/* <Input
            label="Phone Number"
            type="tel"
            placeholder="10-digit mobile"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          /> */}
          <div>
            <label className="label">Location *</label>
            <select
              className="input"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              required
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              {editWorker ? 'Save Changes' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Worker"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <HiTrash className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Delete {deleteTarget?.name}?</p>
            <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
