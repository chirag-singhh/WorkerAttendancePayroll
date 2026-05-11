import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { getCurrentMonthRange, formatCurrency, formatDate } from '../../utils/dateUtils';

export default function Reports() {
  const { activeLocation, locations } = useAuth();
  const insets = useSafeAreaInsets();
  const { startDate, endDate } = getCurrentMonthRange();
  
  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const [reportStartDate, setReportStartDate] = useState(startDate);
  const [reportEndDate, setReportEndDate] = useState(endDate);
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (err: any) {
      console.log('Reports fetch error', err?.response?.status);
      setMonthlyData([]);
      setGrandTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  }, [filterLocation, reportStartDate, reportEndDate]);

  const handleExport = () => {
    if (!filterLocation) {
      Alert.alert('Error', 'Select a location first');
      return;
    }
    reportService.exportExcel({
      locationId: filterLocation,
      startDate: reportStartDate,
      endDate: reportEndDate,
    });
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Reports</Text>
          <Text className="text-sm text-gray-500 mt-0.5">Payroll and attendance summaries</Text>
        </View>
        <TouchableOpacity
          onPress={handleExport}
          disabled={loading || !filterLocation}
          className={`px-4 py-2 rounded-xl flex-row items-center ${loading || !filterLocation ? 'bg-gray-100' : 'bg-primary-50'}`}
        >
          <Ionicons name="download" size={20} color={loading || !filterLocation ? '#9ca3af' : '#2563eb'} />
          <Text className={`font-medium ml-1 ${loading || !filterLocation ? 'text-gray-400' : 'text-primary-700'}`}>
            Export
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
      >
        {grandTotals && (
          <View className="flex-row justify-between mb-6">
            <View className="bg-primary-600 rounded-2xl p-4 w-[48%] shadow-sm">
              <Text className="text-primary-100 text-xs font-medium">Total Payroll</Text>
              <Text className="text-white text-xl font-black mt-1" numberOfLines={1}>{formatCurrency(grandTotals.totalAmount)}</Text>
            </View>
            <View className="bg-blue-500 rounded-2xl p-4 w-[48%] shadow-sm">
              <Text className="text-blue-100 text-xs font-medium">Total Shifts</Text>
              <Text className="text-white text-xl font-black mt-1">{grandTotals.totalShift}</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : !filterLocation ? (
          <View className="items-center py-10">
            <Ionicons name="bar-chart" size={48} color="#d1d5db" />
            <Text className="text-gray-500 font-medium mt-4">Select a location</Text>
          </View>
        ) : monthlyData.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="bar-chart" size={48} color="#d1d5db" />
            <Text className="text-gray-500 font-medium mt-4">No data found</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {monthlyData.map((row, idx) => (
              <View
                key={idx}
                className={`p-4 flex-row justify-between items-center ${
                  idx !== monthlyData.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#2563eb" />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="font-medium text-gray-900" numberOfLines={1}>{row.workerId?.name || 'Unknown'}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                      {row.totalShift} shifts @ {formatCurrency(row.workerId?.rate)}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-green-600">{formatCurrency(row.totalAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
