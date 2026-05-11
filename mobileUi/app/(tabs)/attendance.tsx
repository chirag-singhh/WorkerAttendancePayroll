import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { attendanceService } from '../../services/attendanceService';
import { getDateRange, formatDayDate, formatCurrency, today } from '../../utils/dateUtils';
import { getShiftBadgeStyle, SHIFT_OPTIONS } from '../../utils/shiftUtils';
import dayjs from 'dayjs';

const LEGEND = [
  { label: 'Absent (A)', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  { label: 'Present (P)', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  { label: 'Half (P½)', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  { label: 'High (2P+)', bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
];

function ShiftCell({ value, onOpenPicker }: any) {
  const numVal = value !== undefined && value !== null ? parseFloat(value) : 0;
  const style = getShiftBadgeStyle(numVal);
  const isKnown = SHIFT_OPTIONS.some(o => typeof o.value === 'number' && o.value === numVal);
  const displayLabel = isKnown
    ? SHIFT_OPTIONS.find(o => o.value === numVal)?.label
    : `${numVal}`;

  return (
    <TouchableOpacity
      onPress={onOpenPicker}
      className="w-[52px] h-8 rounded-lg items-center justify-center border mx-1"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <Text style={{ color: style.text, fontSize: 12, fontWeight: 'bold' }}>{displayLabel}</Text>
    </TouchableOpacity>
  );
}

export default function Attendance() {
  const { activeLocation, locations } = useAuth();
  const insets = useSafeAreaInsets();

  const defaultStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const defaultEnd = dayjs().format('YYYY-MM-DD');

  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  
  const [workers, setWorkers] = useState([]);
  const [grid, setGrid] = useState<any>({});
  const [recordMap, setRecordMap] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [activeCell, setActiveCell] = useState<{workerId: string, date: string, value: number} | null>(null);
  const [customShiftValue, setCustomShiftValue] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (event.type === 'set' && selectedDate) {
      setStartDate(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (event.type === 'set' && selectedDate) {
      setEndDate(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

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
      const wList = (workersRes.data.workers || workersRes.data || []).filter((w: any) => w.active !== false);
      const attList = attRes.data.attendance || attRes.data || [];
      const dateList = getDateRange(startDate, endDate);

      const newGrid: any = {};
      const newRecordMap: any = {};

      wList.forEach((w: any) => {
        newGrid[w._id] = {};
        dateList.forEach(d => { newGrid[w._id][d] = 0; });
      });

      attList.forEach((rec: any) => {
        const wid = rec.workerId?._id || rec.workerId;
        if (!newGrid[wid]) return;
        newRecordMap[wid] = rec._id;
        (rec.attendance || []).forEach((item: any) => {
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
    } catch (err: any) {
      console.log('Attendance fetch error', err?.response?.status);
      setWorkers([]);
      setDates([]);
      setGrid({});
      setRecordMap({});
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const updateShift = (workerId: string, date: string, value: number) => {
    setGrid((prev: any) => ({
      ...prev,
      [workerId]: { ...prev[workerId], [date]: value },
    }));
  };

  const calcTotals = (workerId: any) => {
    const shifts = Object.values(grid[workerId] || {});
    const total = shifts.reduce((acc: any, v: any) => acc + (parseFloat(v) || 0), 0) as number;
    const worker = workers.find((w: any) => w._id === workerId) as any;
    const amount = total * (worker?.rate || 0);
    return { total, amount };
  };

  const grandTotals = () => {
    let totalShifts = 0;
    let totalAmount = 0;
    workers.forEach((w: any) => {
      const { total, amount } = calcTotals(w._id);
      totalShifts += total;
      totalAmount += amount;
    });
    return { totalShifts, totalAmount };
  };

  const handleSave = async () => {
    if (!filterLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    setSaving(true);
    try {
      const promises = workers.map(async (worker: any) => {
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
      Alert.alert('Success', 'Attendance saved successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    attendanceService.exportExcel({
      startDate,
      endDate,
      ...(filterLocation ? { locationId: filterLocation } : {}),
    });
    Alert.alert('Exporting', 'Export has started.');
  };

  const { totalShifts, totalAmount } = grandTotals();

  const selectedLocName = locations.find((l: any) => l._id === filterLocation)?.name || 'All Locations';

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 20 }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100 flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-2xl font-bold text-gray-900">Attendance</Text>
          <Text className="text-sm text-gray-500 mt-0.5">Mark and track daily attendance</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity onPress={handleExport} className="bg-gray-100 p-2 rounded-xl border border-gray-200 mr-2">
            <Ionicons name="download" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-primary-600 px-4 py-2 rounded-xl flex-row items-center shadow-sm">
            {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="save" size={18} color="white" />}
            <Text className="text-white font-medium ml-1">Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <View className="flex-1 mr-2">
             <Text className="text-xs text-gray-500 mb-1 font-medium">Location</Text>
             <TouchableOpacity 
               onPress={() => setShowLocationPicker(!showLocationPicker)}
               className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-row justify-between items-center"
             >
               <Text className="text-sm text-gray-800" numberOfLines={1}>{selectedLocName}</Text>
               <Ionicons name="chevron-down" size={16} color="#6b7280" />
             </TouchableOpacity>
             {showLocationPicker && (
                <View className="absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {locations.map((loc: any) => (
                    <TouchableOpacity 
                      key={loc._id} 
                      className="px-3 py-2 border-b border-gray-100"
                      onPress={() => { setFilterLocation(loc._id); setShowLocationPicker(false); }}
                    >
                      <Text className="text-sm text-gray-800">{loc.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
             )}
          </View>
        </View>
        <View className="flex-row items-center">
          <View className="flex-1 mr-2">
            <Text className="text-xs text-gray-500 mb-1 font-medium">Start Date</Text>
            <TouchableOpacity 
              onPress={() => setShowStartPicker(true)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-row justify-between items-center"
            >
              <Text className="text-sm text-gray-800">{dayjs(startDate).format('MMM D, YYYY')}</Text>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={new Date(startDate)}
                mode="date"
                display="default"
                onChange={onStartDateChange}
              />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 mb-1 font-medium">End Date</Text>
            <TouchableOpacity 
              onPress={() => setShowEndPicker(true)}
              className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-row justify-between items-center"
            >
              <Text className="text-sm text-gray-800">{dayjs(endDate).format('MMM D, YYYY')}</Text>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={new Date(endDate)}
                mode="date"
                display="default"
                onChange={onEndDateChange}
              />
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
      >
        <View className="flex-row flex-wrap gap-2 mb-4">
          {LEGEND.map(l => (
            <View key={l.label} className="px-2 py-1 rounded border" style={{ backgroundColor: l.bg, borderColor: l.border }}>
              <Text style={{ color: l.text, fontSize: 10, fontWeight: '500' }}>{l.label}</Text>
            </View>
          ))}
        </View>

        {workers.length > 0 && (
          <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xs font-medium text-blue-600">Grand Total Shifts</Text>
              <Text className="text-2xl font-black text-blue-800">{totalShifts.toFixed(1)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-medium text-blue-600">Total Payroll</Text>
              <Text className="text-2xl font-black text-blue-800">{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : !filterLocation ? (
          <View className="items-center py-10">
            <Ionicons name="calendar" size={48} color="#d1d5db" />
            <Text className="text-gray-500 font-medium mt-4">Select a location</Text>
          </View>
        ) : workers.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="people" size={48} color="#d1d5db" />
            <Text className="text-gray-500 font-medium mt-4">No active workers</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-row">
            
            {/* Sticky Left Column (Workers) */}
            <View className="w-28 border-r border-gray-100 bg-white shadow-sm z-10">
              <View className="h-12 border-b border-gray-100 bg-gray-50 px-3 justify-center">
                <Text className="font-semibold text-gray-600 text-[11px]">Worker</Text>
              </View>
              {workers.map((worker: any) => (
                <View key={worker._id} className="h-14 border-b border-gray-50 px-2 justify-center">
                  <Text className="font-semibold text-gray-900 text-xs" numberOfLines={1}>{worker.name}</Text>
                  <Text className="text-[9px] text-gray-400" numberOfLines={1}>{worker.customDepartment || worker.department}</Text>
                </View>
              ))}
            </View>

            {/* Scrollable Right Columns (Dates & Totals) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
              <View>
                {/* Header Row */}
                <View className="flex-row h-12 border-b border-gray-100 bg-gray-50">
                  {dates.map(date => {
                    const { day, date: d } = formatDayDate(date);
                    const isWeekend = dayjs(date).day() === 0 || dayjs(date).day() === 6;
                    return (
                      <View key={date} className={`w-[60px] items-center justify-center ${isWeekend ? 'bg-orange-50' : ''}`}>
                        <Text className={`text-[9px] ${isWeekend ? 'text-orange-700' : 'text-gray-500'}`}>{day}</Text>
                        <Text className={`text-xs font-bold ${isWeekend ? 'text-orange-700' : 'text-gray-800'}`}>{d}</Text>
                      </View>
                    );
                  })}
                  <View className="w-16 items-center justify-center bg-green-50 border-l border-green-100">
                    <Text className="font-semibold text-green-700 text-[11px]">Shifts</Text>
                  </View>
                  <View className="w-20 items-center justify-center bg-purple-50 border-l border-purple-100">
                    <Text className="font-semibold text-purple-700 text-[11px]">Amount</Text>
                  </View>
                </View>

                {/* Worker Rows */}
                {workers.map((worker: any) => {
                  const { total, amount } = calcTotals(worker._id);
                  return (
                    <View key={worker._id} className="flex-row h-14 border-b border-gray-50">
                      {dates.map(date => (
                        <View key={date} className="w-[60px] items-center justify-center">
                        <ShiftCell
                            value={grid[worker._id]?.[date] ?? 0}
                            onOpenPicker={() => setActiveCell({ workerId: worker._id, date, value: grid[worker._id]?.[date] ?? 0 })}
                          />
                        </View>
                      ))}
                      <View className="w-16 items-center justify-center bg-green-50 border-l border-green-100">
                        <Text className="font-bold text-green-700 text-sm">{total.toFixed(1)}</Text>
                      </View>
                      <View className="w-20 items-center justify-center bg-purple-50 border-l border-purple-100">
                        <Text className="font-bold text-purple-700 text-xs" numberOfLines={1}>{formatCurrency(amount)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Shift Selection Modal */}
      {activeCell && (
        <View className="absolute inset-0 bg-black/50 justify-end z-[100]">
          <TouchableOpacity className="flex-1" onPress={() => setActiveCell(null)} />
          <View className="bg-white rounded-t-3xl p-5 shadow-2xl pb-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Select Shift</Text>
              <TouchableOpacity onPress={() => setActiveCell(null)}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row flex-wrap justify-between">
              {SHIFT_OPTIONS.filter(o => o.value !== 'custom').map((opt) => {
                const style = getShiftBadgeStyle(opt.value);
                const isSelected = activeCell.value === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      updateShift(activeCell.workerId, activeCell.date, opt.value as number);
                      setActiveCell(null);
                    }}
                    className={`w-[31%] mb-3 p-3 rounded-xl border ${isSelected ? 'border-primary-500 border-2' : ''}`}
                    style={{ backgroundColor: style.bg, borderColor: isSelected ? '#3b82f6' : style.border }}
                  >
                    <Text className="text-center font-bold text-lg mb-0.5" style={{ color: style.text }}>{opt.label}</Text>
                    <Text className="text-center text-[10px]" style={{ color: style.text }}>{opt.display}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View className="mt-2 pt-4 border-t border-gray-100 flex-row items-center">
              <Text className="font-semibold text-gray-700 w-24">Custom:</Text>
              <TextInput
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900"
                keyboardType="numeric"
                placeholder="0.0"
                value={customShiftValue}
                onChangeText={setCustomShiftValue}
              />
              <TouchableOpacity
                onPress={() => {
                  const num = parseFloat(customShiftValue);
                  if (!isNaN(num) && num >= 0) {
                    updateShift(activeCell.workerId, activeCell.date, num);
                    setActiveCell(null);
                    setCustomShiftValue('');
                  } else {
                    Alert.alert('Invalid', 'Please enter a valid number');
                  }
                }}
                className="ml-2 bg-primary-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-bold">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
