import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Users, ClipboardCheck, MapPin, IndianRupee, TrendingUp, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, locations: 0, attendance: 0, totalAmount: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [workersRes, locationsRes, attendanceRes, payrollRes] = await Promise.all([
        api.get('/worker'),
        api.get('/location'),
        api.get('/attendance'),
        api.get('/attendance/payroll/report'),
      ]);

      setStats({
        workers: workersRes.data.count,
        locations: locationsRes.data.count,
        attendance: attendanceRes.data.count,
        totalAmount: payrollRes.data.grandTotalAmount,
      });

      // Chart data - payroll by worker
      const workerMap = {};
      payrollRes.data.payroll.forEach((rec) => {
        const name = rec.workerId?.name || 'Unknown';
        workerMap[name] = (workerMap[name] || 0) + rec.totalAmount;
      });
      const chart = Object.entries(workerMap).map(([name, amount]) => ({ name, amount }));
      setChartData(chart.slice(0, 8));

      setRecentAttendance(attendanceRes.data.attendance.slice(0, 5));
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your workforce and payroll</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div>
            <div className="stat-value">{stats.workers}</div>
            <div className="stat-label">Total Workers</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><MapPin size={22} /></div>
          <div>
            <div className="stat-value">{stats.locations}</div>
            <div className="stat-label">Locations</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><ClipboardCheck size={22} /></div>
          <div>
            <div className="stat-value">{stats.attendance}</div>
            <div className="stat-label">Attendance Records</div>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><IndianRupee size={22} /></div>
          <div>
            <div className="stat-value">₹{stats.totalAmount.toLocaleString()}</div>
            <div className="stat-label">Total Payroll</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Chart */}
        <div className="card">
          <div className="section-title"><TrendingUp size={18} />Payroll by Worker</div>
          {chartData.length === 0 ? (
            <div className="empty-state">
              <p>No payroll data yet</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid rgba(99,130,255,0.2)', borderRadius: '8px', color: '#f1f5f9' }}
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="section-title"><Activity size={18} />Recent Attendance</div>
          {recentAttendance.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentAttendance.map((rec) => (
                <div
                  key={rec._id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: 'var(--bg-secondary)',
                    borderRadius: '8px', border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rec.workerId?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(rec.startDate).toLocaleDateString()} – {new Date(rec.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green)' }}>
                      ₹{rec.totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {rec.totalShift} shifts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
