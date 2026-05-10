import { useEffect, useState } from 'react';
import { HiDownload, HiChartBar, HiUser } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import { getCurrentMonthRange, formatCurrency, formatDate } from '../utils/dateUtils';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Reports() {
  const { activeLocation, locations } = useAuth();
  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const { startDate, endDate } = getCurrentMonthRange();
  const [reportStartDate, setReportStartDate] = useState(startDate);
  const [reportEndDate, setReportEndDate] = useState(endDate);
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeLocation) setFilterLocation(activeLocation._id);
  }, [activeLocation]);

  useEffect(() => {
    fetchReport();
  }, [filterLocation, reportStartDate, reportEndDate]);

  const fetchReport = async () => {
    if (!filterLocation || !reportStartDate || !reportEndDate) return;
    setLoading(true);
    try {
      const params = { locationId: filterLocation, startDate: reportStartDate, endDate: reportEndDate };
      const [monthlyRes, grandRes] = await Promise.all([
        reportService.monthly(params),
        reportService.grandTotal(params),
      ]);
      setMonthlyData(monthlyRes.data.report || monthlyRes.data || []);
      setGrandTotals(grandRes.data);
    } catch {
      toast.error('Failed to load reports');
      setMonthlyData([]);
      setGrandTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!filterLocation) {
      toast.error('Select a location first');
      return;
    }
    reportService.exportExcel({
      locationId: filterLocation,
      startDate: reportStartDate,
      endDate: reportEndDate,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payroll and attendance summaries</p>
        </div>
        <Button variant="secondary" onClick={handleExport} className="gap-1.5" disabled={loading || !filterLocation}>
          <HiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Export Excel</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[130px]">
            <label className="label text-xs">Location</label>
            <select
              className="input py-2 text-sm"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="label text-xs">Start Date</label>
            <input
              type="date"
              className="input py-2 text-sm"
              value={reportStartDate}
              max={reportEndDate}
              onChange={(e) => setReportStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="label text-xs">End Date</label>
            <input
              type="date"
              className="input py-2 text-sm"
              value={reportEndDate}
              min={reportStartDate}
              onChange={(e) => setReportEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grand Totals */}
      {grandTotals && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card p-4 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
            <p className="text-primary-100 text-sm font-medium">Total Payroll</p>
            <p className="text-2xl font-black mt-1">{formatCurrency(grandTotals.totalAmount)}</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
            <p className="text-blue-100 text-sm font-medium">Total Shifts</p>
            <p className="text-2xl font-black mt-1">{grandTotals.totalShift}</p>
          </div>
          <div className="card p-4 hidden md:block">
            <p className="text-gray-500 text-sm font-medium">Period</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatDate(reportStartDate)} - {formatDate(reportEndDate)}
            </p>
          </div>
        </div>
      )}

      {/* Worker List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !filterLocation ? (
        <EmptyState
          icon={<HiChartBar className="w-8 h-8" />}
          title="Select a location"
          description="Choose a location to view reports"
        />
      ) : monthlyData.length === 0 ? (
        <EmptyState
          icon={<HiChartBar className="w-8 h-8" />}
          title="No data found"
          description="No attendance records for this period"
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Worker</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Rate</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Shifts</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.workerId?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-500">{row.workerId?.customDepartment || row.workerId?.department}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(row.workerId?.rate)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{row.totalShift}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(row.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {monthlyData.map((row, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <HiUser className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{row.workerId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{row.totalShift} shifts @ {formatCurrency(row.workerId?.rate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(row.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
