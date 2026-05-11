import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { attendanceService } from '../../services/attendanceService';
import { reportService } from '../../services/reportService';
import { formatCurrency, today, getCurrentMonthRange } from '../../utils/dateUtils';
import dayjs from 'dayjs';

function StatCard({ iconName, label, value, colorClass, iconColor }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 w-[48%] mb-3">
      <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${colorClass}`}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <Text className="text-xs text-gray-500 font-medium">{label}</Text>
      <Text className="text-xl font-bold text-gray-900 mt-1">
        {value !== null ? value : <ActivityIndicator size="small" />}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  const { activeLocation, locations, user, setActiveLocation } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [stats, setStats] = useState({ total: null, active: null, todayShifts: null, payroll: null });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    loadRecent();
  }, [activeLocation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadRecent()]);
    setRefreshing(false);
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <ScrollView 
      className="flex-1 bg-surface px-4"
      style={{ paddingTop: insets.top + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
      }
    >
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </Text>
        <TouchableOpacity 
          onPress={() => setShowLocationPicker(!showLocationPicker)}
          className="flex-row items-center mt-1.5 self-start px-2 py-1 bg-blue-50 rounded-lg border border-blue-100"
        >
          <Ionicons name="location" size={14} color="#2563eb" />
          <Text className="text-blue-700 font-medium text-sm ml-1">
            {activeLocation ? activeLocation.name : 'No location selected'}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#2563eb" className="ml-1" />
        </TouchableOpacity>
        <Text className="text-gray-400 text-xs mt-2">{dayjs().format('D MMMM YYYY')}</Text>

        {showLocationPicker && (
          <View className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            {locations.map((loc: any) => (
              <TouchableOpacity 
                key={loc._id} 
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => { setActiveLocation(loc); setShowLocationPicker(false); }}
              >
                <Text className="text-sm font-medium text-gray-800">{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {!activeLocation && locations.length === 0 && (
        <View className="bg-primary-50 border-l-4 border-primary-500 rounded-lg p-4 mb-6">
          <Text className="font-semibold text-primary-900 text-sm">Welcome to WorkerPay!</Text>
          <Text className="text-primary-700 text-sm mt-1">
            Start by adding a location in Settings, then add your workers.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="bg-primary-600 rounded-lg py-2 mt-3 items-center"
          >
            <Text className="text-white font-medium text-sm">Go to Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between mb-6">
        <StatCard
          iconName="people"
          label="Total Workers"
          value={stats.total}
          colorClass="bg-blue-50"
          iconColor="#2563eb"
        />
        <StatCard
          iconName="checkmark-circle"
          label="Active Workers"
          value={stats.active}
          colorClass="bg-green-50"
          iconColor="#16a34a"
        />
        <StatCard
          iconName="time"
          label="Monthly Shifts"
          value={stats.todayShifts}
          colorClass="bg-orange-50"
          iconColor="#ea580c"
        />
        <StatCard
          iconName="cash"
          label="Monthly Payroll"
          value={stats.payroll}
          colorClass="bg-purple-50"
          iconColor="#9333ea"
        />
      </View>

      <View className="mb-6">
        <Text className="text-base font-semibold text-gray-800 mb-3">Quick Actions</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => router.push('/workers')}
            className="bg-primary-600 rounded-2xl p-4 items-center w-[31%] shadow-sm"
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text className="text-white text-xs font-semibold mt-2 text-center">Add Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/attendance')}
            className="bg-green-500 rounded-2xl p-4 items-center w-[31%] shadow-sm"
          >
            <Ionicons name="clipboard" size={24} color="#ffffff" />
            <Text className="text-white text-xs font-semibold mt-2 text-center">Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/reports')}
            className="bg-purple-500 rounded-2xl p-4 items-center w-[31%] shadow-sm"
          >
            <Ionicons name="bar-chart" size={24} color="#ffffff" />
            <Text className="text-white text-xs font-semibold mt-2 text-center">Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-semibold text-gray-800">Recent Attendance</Text>
          <TouchableOpacity onPress={() => router.push('/attendance')}>
            <Text className="text-sm text-primary-600 font-medium">View all →</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loadingRecent ? (
            <View className="py-10 items-center">
              <ActivityIndicator />
            </View>
          ) : recentAttendance.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-gray-400 text-sm">No recent attendance records</Text>
            </View>
          ) : (
            recentAttendance.map((rec, index) => (
              <View
                key={rec._id}
                className={`flex-row justify-between items-center px-4 py-3 ${
                  index !== recentAttendance.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
                    {rec.workerId?.name || 'Worker'}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {dayjs(rec.startDate).format('D MMM')} – {dayjs(rec.endDate).format('D MMM YYYY')}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-gray-900">{rec.totalShift} shifts</Text>
                  <Text className="text-xs text-green-600 font-medium">{formatCurrency(rec.totalAmount)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
