import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ClipboardCheck, X, Search, Calendar } from 'lucide-react';

// Generate date range array
function getDatesBetween(start, end) {
  const dates = [];
  const cur = new Date(start);
  const endD = new Date(end);
  while (cur <= endD) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function AttendanceModal({ record, workers, onClose, onSave }) {
  const [workerId, setWorkerId] = useState(record?.workerId?._id || record?.workerId || '');
  const [startDate, setStartDate] = useState(
    record?.startDate ? record.startDate.split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    record?.endDate ? record.endDate.split('T')[0] : ''
  );
  const [shifts, setShifts] = useState({});
  const [loading, setLoading] = useState(false);

  const dates = startDate && endDate ? getDatesBetween(startDate, endDate) : [];

  useEffect(() => {
    if (record?.attendance) {
      const s = {};
      record.attendance.forEach(item => {
        s[item.date.split('T')[0]] = item.shift;
      });
      setShifts(s);
    }
  }, [record]);

  const handleShiftChange = (dateStr, val) => {
    setShifts(prev => ({ ...prev, [dateStr]: val }));
  };

  const buildAttendanceArray = () => dates.map(d => {
    const ds = d.toISOString().split('T')[0];
    return { date: ds, shift: Number(shifts[ds] ?? 0) };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workerId || !startDate || !endDate) {
      toast.error('Please fill all required fields');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        workerId,
        startDate,
        endDate,
        attendance: buildAttendanceArray(),
      };
      if (record) {
        await api.put(`/attendance/${record._id}`, payload);
        toast.success('Attendance updated!');
      } else {
        await api.post('/attendance', payload);
        toast.success('Attendance saved!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <h2 className="modal-title">{record ? 'Edit Attendance' : 'Mark Attendance'}</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Worker *</label>
                <select className="form-select" value={workerId} onChange={e => setWorkerId(e.target.value)}>
                  <option value="">Select worker</option>
                  {workers.map(w => (
                    <option key={w._id} value={w._id}>{w.name} ({w.memberId})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-input" value={startDate} onChange={e => { setStartDate(e.target.value); setShifts({}); }} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input type="date" className="form-input" value={endDate} onChange={e => { setEndDate(e.target.value); setShifts({}); }} />
              </div>
            </div>

            {dates.length > 0 && (
              <>
                <div className="divider" />
                <div className="section-title">
                  <Calendar size={16} />
                  Daily Shifts ({dates.length} days)
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                    — 0 = Absent, 0.5 = Half Day, 1 = Full Day
                  </span>
                </div>
                <div className="attendance-date-grid">
                  {dates.map(d => {
                    const ds = d.toISOString().split('T')[0];
                    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = d.getDate();
                    return (
                      <div key={ds} className="attendance-date-cell">
                        <div className="date-label">{day} {dateNum}</div>
                        <select
                          className="shift-input"
                          value={shifts[ds] ?? 0}
                          onChange={e => handleShiftChange(ds, e.target.value)}
                          style={{ appearance: 'none', cursor: 'pointer' }}
                        >
                          <option value={0}>0</option>
                          <option value={0.5}>½</option>
                          <option value={1}>1</option>
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: '16px', padding: '14px 16px',
                  background: 'var(--bg-secondary)', borderRadius: '8px',
                  border: '1px solid var(--border)', display: 'flex', gap: '24px'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Shifts: </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>
                      {Object.values(shifts).reduce((a, b) => a + Number(b), 0)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : record ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterWorker, setFilterWorker] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [aRes, wRes] = await Promise.all([api.get('/attendance'), api.get('/worker')]);
      setRecords(aRes.data.attendance || []);
      setWorkers(wRes.data.workers || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filtered = records.filter(r => {
    const matchSearch = r.workerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.workerId?.memberId?.toLowerCase().includes(search.toLowerCase());
    const matchWorker = !filterWorker || r.workerId?._id === filterWorker;
    return matchSearch && matchWorker;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track daily shift records for all workers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={16} /> Mark Attendance
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrapper" style={{ flex: 2 }}>
            <Search size={15} />
            <input className="form-input" placeholder="Search by worker name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: '200px' }} value={filterWorker} onChange={e => setFilterWorker(e.target.value)}>
            <option value="">All Workers</option>
            {workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardCheck size={28} /></div>
            <h3>No attendance records</h3>
            <p>Start marking attendance for your workers.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Location</th>
                  <th>Period</th>
                  <th>Total Shifts</th>
                  <th>Rate/Day</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.workerId?.name || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.workerId?.memberId}</div>
                    </td>
                    <td>{rec.locationId?.name || '—'}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        {new Date(rec.startDate).toLocaleDateString()} →
                      </div>
                      <div style={{ fontSize: '13px' }}>{new Date(rec.endDate).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{rec.totalShift} shifts</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{rec.workerId?.rate?.toLocaleString()}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700, fontSize: '15px' }}>
                      ₹{rec.totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setModal(rec)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(rec._id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <AttendanceModal
          record={modal === 'create' ? null : modal}
          workers={workers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
