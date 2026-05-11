import { useEffect, useState, useCallback } from 'react';
import { HiDownload, HiSave, HiTrash, HiCalendar, HiInformationCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { workerService } from '../services/workerService';
import { attendanceService } from '../services/attendanceService';
import { getDateRange, formatDayDate, formatCurrency, today } from '../utils/dateUtils';
import { getShiftBadgeStyle, SHIFT_OPTIONS } from '../utils/shiftUtils';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// Shift color legend
const LEGEND = [
  { label: 'Absent (A)', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  { label: 'Present (P)', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  { label: 'Half (P½)', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { label: 'High (2P+)', bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
];

// Single shift cell dropdown
function ShiftCell({ value, onChange }) {
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const numVal = value !== undefined && value !== null ? parseFloat(value) : 0;
  const style = getShiftBadgeStyle(numVal);

  const handleChange = (e) => {
    const v = e.target.value;
    if (v === 'custom') {
      setCustom(true);
    } else {
      setCustom(false);
      onChange(parseFloat(v));
    }
  };

  const commitCustom = () => {
    const num = parseFloat(customVal);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
      setCustom(false);
      setCustomVal('');
    } else {
      toast.error('Enter a valid shift value');
    }
  };

  if (custom) {
    return (
      <div className="flex items-center gap-1 min-w-[90px]">
        <input
          type="number"
          step="0.5"
          min="0"
          className="w-14 text-xs px-1.5 py-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
          value={customVal}
          onChange={(e) => setCustomVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitCustom()}
          autoFocus
          placeholder="0.0"
        />
        <button
          onClick={commitCustom}
          className="text-xs text-green-700 font-bold hover:text-green-900 px-1"
        >
          ✓
        </button>
        <button
          onClick={() => setCustom(false)}
          className="text-xs text-red-500 font-bold hover:text-red-700 px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  // Find if current value is a known option
  const isKnown = SHIFT_OPTIONS.some(o => typeof o.value === 'number' && o.value === numVal);
  const displayLabel = isKnown
    ? SHIFT_OPTIONS.find(o => o.value === numVal)?.label
    : `${numVal}`;

  return (
    <div className="relative min-w-[64px]">
      <select
        value={isKnown ? numVal : 'custom_active'}
        onChange={handleChange}
        className="appearance-none w-full text-xs font-bold px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
        style={{
          backgroundColor: style.bg,
          color: style.text,
          borderColor: style.border,
        }}
      >
        {SHIFT_OPTIONS.filter(o => o.value !== 'custom').map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        {!isKnown && (
          <option value="custom_active">{displayLabel}</option>
        )}
        <option value="custom">Custom...</option>
      </select>
    </div>
  );
}

export default function Attendance() {
  const { activeLocation, locations } = useAuth();

  const defaultStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const defaultEnd = dayjs().format('YYYY-MM-DD');

  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [workers, setWorkers] = useState([]);
  const [existingRecords, setExistingRecords] = useState([]);
  // grid: { [workerId]: { [date]: shift } }
  const [grid, setGrid] = useState({});
  // record ids: { [workerId]: recordId }
  const [recordMap, setRecordMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    if (activeLocation) setFilterLocation(activeLocation._id);
  }, [activeLocation]);

  const loadData = useCallback(async () => {
    if (!startDate || !endDate || !filterLocation) return;
    setLoading(true);
    try {
      const [workersRes, attRes] = await Promise.all([
        workerService.getAll(filterLocation),
        attendanceService.getAll({ startDate, endDate }),
      ]);
      const wList = (workersRes.data.workers || workersRes.data || []).filter(w => w.active !== false);
      const attList = attRes.data.attendance || attRes.data || [];
      const dateList = getDateRange(startDate, endDate);

      // Build grid from existing records
      const newGrid = {};
      const newRecordMap = {};

      wList.forEach(w => {
        newGrid[w._id] = {};
        dateList.forEach(d => { newGrid[w._id][d] = 0; });
      });

      attList.forEach(rec => {
        const wid = rec.workerId?._id || rec.workerId;
        if (!newGrid[wid]) return;
        newRecordMap[wid] = rec._id;
        (rec.attendance || []).forEach(item => {
          const dateStr = dayjs(item.date).format('YYYY-MM-DD');
          if (newGrid[wid] && dateStr in newGrid[wid]) {
            newGrid[wid][dateStr] = item.shift;
          }
        });
      });

      setWorkers(wList);
      setDates(dateList);
      setGrid(newGrid);
      setRecordMap(newRecordMap);
      setExistingRecords(attList);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateShift = (workerId, date, value) => {
    setGrid(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], [date]: value },
    }));
  };

  const calcTotals = (workerId) => {
    const shifts = Object.values(grid[workerId] || {});
    const total = shifts.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
    const worker = workers.find(w => w._id === workerId);
    const amount = total * (worker?.rate || 0);
    return { total, amount };
  };

  const grandTotals = () => {
    let totalShifts = 0, totalAmount = 0;
    workers.forEach(w => {
      const { total, amount } = calcTotals(w._id);
      totalShifts += total;
      totalAmount += amount;
    });
    return { totalShifts, totalAmount };
  };

  const handleSave = async () => {
    if (!filterLocation) {
      toast.error('Please select a location');
      return;
    }
    setSaving(true);
    try {
      const promises = workers.map(async (worker) => {
        const attendanceArr = dates.map(date => ({
          date,
          shift: parseFloat(grid[worker._id]?.[date]) || 0,
        }));

        const payload = {
          workerId: worker._id,
          locationId: filterLocation,
          startDate,
          endDate,
          attendance: attendanceArr,
        };

        const existingId = recordMap[worker._id];
        if (existingId) {
          return attendanceService.update(existingId, payload);
        } else {
          return attendanceService.create(payload);
        }
      });

      await Promise.all(promises);
      toast.success('Attendance saved successfully!');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // const handleDeleteRecord = async (workerId) => {
  //   const id = recordMap[workerId];
  //   if (!id) { toast.error('No saved record to delete'); return; }
  //   try {
  //     await attendanceService.delete(id);
  //     toast.success('Record deleted');
  //     loadData();
  //   } catch {
  //     toast.error('Failed to delete record');
  //   }
  // };
  const handleDeleteRecord = async (workerId) => {
  try {
    await workerService.delete(workerId);

    setWorkers(prev => prev.filter(w => w._id !== workerId));

    setGrid(prev => {
      const newGrid = { ...prev };
      delete newGrid[workerId];
      return newGrid;
    });

    setRecordMap(prev => {
      const newMap = { ...prev };
      delete newMap[workerId];
      return newMap;
    });

    toast.success('Worker deleted successfully');
  } catch (err) {
    toast.error('Failed to delete worker');
  }
};

  // const handleExport = () => {
  //   attendanceService.exportExcel({
  //     startDate,
  //     endDate,
  //     ...(filterLocation ? { locationId: filterLocation } : {}),
  //   });
  // };
const handleExport = async () => {
  try {
    const res = await attendanceService.exportExcel({
      startDate,
      endDate,
      ...(filterLocation ? { locationId: filterLocation } : {}),
    });

    toast.success("Export started");
  } catch (err) {
    toast.error("Export failed");
  }
};
  const { totalShifts, totalAmount } = grandTotals();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mark and track daily attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} className="gap-1.5">
            <HiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
            <HiSave className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
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
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="label text-xs">End Date</label>
            <input
              type="date"
              className="input py-2 text-sm"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {LEGEND.map(l => (
          <span
            key={l.label}
            className="text-xs px-3 py-1.5 rounded-lg font-medium border"
            style={{ backgroundColor: l.bg, color: l.text, borderColor: l.border }}
          >
            {l.label}
          </span>
        ))}
      </div>

      {/* Grand totals bar */}
      {workers.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-primary-600">Grand Total Shifts</p>
            <p className="text-2xl font-black text-primary-800">{totalShifts.toFixed(1)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-primary-600">Total Payroll</p>
            <p className="text-2xl font-black text-primary-800">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      )}

      {/* Attendance Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !filterLocation ? (
        <EmptyState
          icon={<HiCalendar className="w-8 h-8" />}
          title="Select a location"
          description="Choose a location to load workers and mark attendance"
        />
      ) : workers.length === 0 ? (
        <EmptyState
          icon={<HiCalendar className="w-8 h-8" />}
          title="No active workers"
          description="Add workers to this location first"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="text-sm border-collapse" style={{ minWidth: `${280 + dates.length * 72}px` }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-600 min-w-[160px] border-r border-gray-100 z-10">
                    Worker
                  </th>
                  {dates.map(date => {
                    const { day, date: d } = formatDayDate(date);
                    const isWeekend = dayjs(date).day() === 0 || dayjs(date).day() === 6;
                    return (
                      <th
                        key={date}
                        className={`px-2 py-2 text-center font-semibold min-w-[68px] ${isWeekend ? 'bg-orange-50 text-orange-700' : 'text-gray-600'}`}
                      >
                        <div className="text-xs">{day}</div>
                        <div className="text-sm font-bold">{d}</div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[80px] bg-green-50">Shifts</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[100px] bg-purple-50">Amount</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600 min-w-[60px]">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workers.map(worker => {
                  const { total, amount } = calcTotals(worker._id);
                  return (
                    <tr key={worker._id} className="hover:bg-gray-50 transition-colors">
                      <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-100 z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {worker.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs truncate max-w-[110px]">{worker.name}</p>
                            <p className="text-[10px] text-gray-400">{worker.customDepartment || worker.department}</p>
                          </div>
                        </div>
                      </td>
                      {dates.map(date => (
                        <td key={date} className="px-1 py-1.5 text-center">
                          <ShiftCell
                            value={grid[worker._id]?.[date] ?? 0}
                            onChange={(v) => updateShift(worker._id, date, v)}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center bg-green-50">
                        <span className="font-bold text-green-700 text-sm">{total.toFixed(1)}</span>
                      </td>
                      <td className="px-3 py-2 text-center bg-purple-50">
                        <span className="font-bold text-purple-700 text-xs">{formatCurrency(amount)}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {recordMap[worker._id] && (
                          <button
                            onClick={() => handleDeleteRecord(worker._id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mx-auto"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Grand total row */}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td className="sticky left-0 bg-gray-50 px-4 py-3 border-r border-gray-100 z-10">
                    <span className="text-sm font-black text-gray-800">GRAND TOTAL</span>
                  </td>
                  {dates.map(date => {
                    const dayTotal = workers.reduce((acc, w) => acc + (parseFloat(grid[w._id]?.[date]) || 0), 0);
                    return (
                      <td key={date} className="px-1 py-2 text-center">
                        {dayTotal > 0 && (
                          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {dayTotal.toFixed(1)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center bg-green-100">
                    <span className="font-black text-green-800">{totalShifts.toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-3 text-center bg-purple-100">
                    <span className="font-black text-purple-800 text-xs">{formatCurrency(totalAmount)}</span>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save button bottom (mobile) */}
      {workers.length > 0 && (
        <div className="fixed bottom-20 right-4 md:hidden z-30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-14 h-14 bg-primary-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all"
          >
            {saving ? <Spinner size="sm" /> : <HiSave className="w-6 h-6" />}
          </button>
        </div>
      )}
    </div>
  );
}
