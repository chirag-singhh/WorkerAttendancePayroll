import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiUsers, HiCheckCircle, HiClock, HiCurrencyRupee,
  HiPlus, HiClipboardList, HiChartBar, HiLocationMarker,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { workerService } from '../services/workerService';
import { attendanceService } from '../services/attendanceService';
import { reportService } from '../services/reportService';
import { formatCurrency, today, getCurrentMonthRange } from '../utils/dateUtils';
import Spinner from '../components/ui/Spinner';
import dayjs from 'dayjs';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? <Spinner size="sm" />}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activeLocation, locations, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: null, active: null, todayShifts: null, payroll: null });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecent();
  }, [activeLocation]);

  const loadStats = async () => {
    try {
      const [workersRes, reportRes] = await Promise.all([
        workerService.getAll(activeLocation?._id),
        reportService.grandTotal({ ...getCurrentMonthRange(), locationId: activeLocation?._id }).catch(() => ({ data: {} })),
      ]);

      const workers = workersRes.data.workers || workersRes.data || [];
      const report = reportRes.data;

      setStats({
        total: workers.length,
        active: workers.filter(w => w.active !== false).length,
        todayShifts: report.totalShift ?? '—',
        payroll: report.totalAmount != null ? formatCurrency(report.totalAmount) : '—',
      });
    } catch {
      setStats({ total: 0, active: 0, todayShifts: '—', payroll: '—' });
    }
  };

  const loadRecent = async () => {
    setLoadingRecent(true);
    try {
      const res = await attendanceService.getAll({
        startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        endDate: today(),
        ...(activeLocation?._id ? { locationId: activeLocation._id } : {}),
      });
      const records = res.data.attendance || res.data || [];
      setRecentAttendance(records.slice(0, 5));
    } catch {
      setRecentAttendance([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const quickActions = [
    { label: 'Add Worker', icon: HiPlus, color: 'bg-primary-600 text-white', to: '/workers' },
    { label: 'Mark Attendance', icon: HiClipboardList, color: 'bg-green-500 text-white', to: '/attendance' },
    { label: 'View Reports', icon: HiChartBar, color: 'bg-purple-500 text-white', to: '/reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <HiLocationMarker className="w-4 h-4 text-primary-400" />
          {activeLocation ? activeLocation.name : 'No location selected'}
          {' · '}
          {dayjs().format('dddd, D MMM YYYY')}
        </p>
      </div>

      {/* No location warning */}
      {!activeLocation && locations.length === 0 && (
        <div className="card p-5 border-l-4 border-primary-500 bg-primary-50">
          <p className="font-semibold text-primary-900 text-sm">Welcome to WorkerPay!</p>
          <p className="text-primary-700 text-sm mt-1">
            Start by adding a location in Settings, then add your workers.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="btn-primary mt-3 text-sm py-2"
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={HiUsers}
          label="Total Workers"
          value={stats.total}
          color="bg-blue-50 text-blue-600"
          sub="All workers"
        />
        <StatCard
          icon={HiCheckCircle}
          label="Active Workers"
          value={stats.active}
          color="bg-green-50 text-green-600"
          sub="Currently active"
        />
        <StatCard
          icon={HiClock}
          label="Monthly Shifts"
          value={stats.todayShifts}
          color="bg-orange-50 text-orange-600"
          sub="This month"
        />
        <StatCard
          icon={HiCurrencyRupee}
          label="Monthly Payroll"
          value={stats.payroll}
          color="bg-purple-50 text-purple-600"
          sub="This month"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ label, icon: Icon, color, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`${color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm`}
            >
              <Icon className="w-7 h-7" />
              <span className="text-xs font-semibold text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Attendance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Recent Attendance</h2>
          <button onClick={() => navigate('/attendance')} className="text-sm text-primary-600 font-medium">
            View all →
          </button>
        </div>
        <div className="card overflow-hidden">
          {loadingRecent ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : recentAttendance.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No recent attendance records
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentAttendance.map((rec) => (
                <div key={rec._id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {rec.workerId?.name || 'Worker'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {dayjs(rec.startDate).format('D MMM')} – {dayjs(rec.endDate).format('D MMM YYYY')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{rec.totalShift} shifts</p>
                    <p className="text-xs text-green-600 font-medium">{formatCurrency(rec.totalAmount)}</p>
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
