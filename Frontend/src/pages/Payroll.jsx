import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FileBarChart2, Download, Search, IndianRupee, HardHat, Calendar } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316'];

export default function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [locations, setLocations] = useState([]);
  const [grandTotals, setGrandTotals] = useState({ shift: 0, amount: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', locationId: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLocations(); fetchPayroll(); }, []);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/location');
      setLocations(res.data.locations || []);
    } catch {}
  };

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.locationId) params.locationId = filters.locationId;
      const res = await api.get('/attendance/payroll/report', { params });
      setPayroll(res.data.payroll || []);
      setGrandTotals({ shift: res.data.grandTotalShift, amount: res.data.grandTotalAmount });
    } catch { toast.error('Failed to load payroll data'); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/attendance/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance-payroll.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  // Chart data - group by worker
  const workerMap = {};
  payroll.forEach(rec => {
    const name = rec.workerId?.name || 'Unknown';
    workerMap[name] = (workerMap[name] || 0) + rec.totalAmount;
  });
  const chartData = Object.entries(workerMap).map(([name, value]) => ({ name, value }));

  const filtered = payroll.filter(r =>
    !search ||
    r.workerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.workerId?.memberId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Report</h1>
          <p className="page-subtitle">View and export payroll summaries</p>
        </div>
        <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date" className="form-input"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date" className="form-input"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Location</label>
            <select className="form-select" value={filters.locationId} onChange={e => setFilters({ ...filters, locationId: e.target.value })}>
              <option value="">All Locations</option>
              {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchPayroll} style={{ marginBottom: 0 }}>
            <Search size={15} /> Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={() => { setFilters({ startDate: '', endDate: '', locationId: '' }); setTimeout(fetchPayroll, 0); }}>
            Reset
          </button>
        </div>
      </div>

      {/* Grand Totals */}
      <div className="payroll-total">
        <div className="payroll-total-item">
          <div className="payroll-total-value">{payroll.length}</div>
          <div className="payroll-total-label">Records</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(99,130,255,0.2)', height: '50px' }} />
        <div className="payroll-total-item">
          <div className="payroll-total-value">{grandTotals.shift}</div>
          <div className="payroll-total-label">Total Shifts</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(99,130,255,0.2)', height: '50px' }} />
        <div className="payroll-total-item">
          <div className="payroll-total-value" style={{ color: 'var(--green)' }}>
            ₹{grandTotals.amount.toLocaleString()}
          </div>
          <div className="payroll-total-label">Total Payroll</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '20px' }}>
        {/* Pie Chart */}
        <div className="card">
          <div className="section-title"><IndianRupee size={16} />Payroll Distribution</div>
          {chartData.length === 0 ? (
            <div className="empty-state"><p>No data to display</p></div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
                    contentStyle={{ background: '#111827', border: '1px solid rgba(99,130,255,0.2)', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Summary by Worker */}
        <div className="card">
          <div className="section-title"><HardHat size={16} />Worker Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {chartData.length === 0 ? (
              <div className="empty-state"><p>No data</p></div>
            ) : chartData.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>
                  ₹{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="section-title" style={{ margin: 0 }}><Calendar size={16} />Detailed Records</div>
          <div className="search-input-wrapper" style={{ width: '260px' }}>
            <Search size={15} />
            <input className="form-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileBarChart2 size={28} /></div>
            <h3>No payroll records</h3>
            <p>Mark attendance to generate payroll data.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Dept</th>
                  <th>Location</th>
                  <th>Period</th>
                  <th>Shifts</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.workerId?.name || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.workerId?.memberId}</div>
                    </td>
                    <td><span className="badge badge-purple">{rec.workerId?.department}</span></td>
                    <td>{rec.locationId?.name || '—'}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {new Date(rec.startDate).toLocaleDateString()} → {new Date(rec.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{rec.totalShift}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{rec.workerId?.rate?.toLocaleString()}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700, fontSize: '15px' }}>
                      ₹{rec.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
