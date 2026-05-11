import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { workerService } from '../../services/workerService';
import { DEPARTMENTS } from '../../utils/shiftUtils';
import { formatCurrency } from '../../utils/dateUtils';

const EMPTY_FORM = {
  name: '',
  department: 'Mistry',
  customDepartment: '',
  memberId: '',
  rate: '',
  phone: '',
  locationId: '',
};

export default function Workers() {
  const { activeLocation, locations } = useAuth();
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState(activeLocation?._id || '');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  }, [filterLocation]);

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
      rate: worker.rate ? String(worker.rate) : '',
      phone: worker.phone || '',
      locationId: worker.locationId?._id || worker.locationId || activeLocation?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.rate || !form.locationId) {
      Alert.alert('Error', 'Name, rate, and location are required');
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
        Alert.alert('Success', 'Worker updated!');
      } else {
        await workerService.create(payload);
        Alert.alert('Success', 'Worker added!');
      }
      setShowModal(false);
      fetchWorkers();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await workerService.delete(deleteTarget._id);
      Alert.alert('Success', 'Worker deleted');
      setDeleteTarget(null);
      fetchWorkers();
    } catch {
      Alert.alert('Error', 'Failed to delete worker');
    }
  };

  const handleToggle = async (worker) => {
    try {
      await workerService.toggleStatus(worker._id);
      fetchWorkers();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const filtered = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.department?.toLowerCase().includes(search.toLowerCase()) ||
    w.memberId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top + 20 }}>
      <View className="px-4 pt-4 pb-2 border-b border-gray-100 bg-white">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Workers</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{workers.length} total workers</Text>
          </View>
          <TouchableOpacity onPress={openAdd} className="bg-primary-600 px-4 py-2 rounded-xl flex-row items-center active:bg-primary-700">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium ml-1">Add</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row space-x-2 mb-2">
          <View className="flex-1 relative flex-row items-center">
            <View className="absolute left-3 z-10">
              <Ionicons name="search" size={18} color="#9ca3af" />
            </View>
            <TextInput
              className="w-full bg-gray-50 px-4 py-2.5 pl-10 rounded-xl border border-gray-200 text-sm"
              placeholder="Search workers..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="people" size={48} color="#d1d5db" />
            <Text className="text-gray-500 font-medium mt-4">
              {search ? 'No workers found' : 'No workers yet'}
            </Text>
          </View>
        ) : (
          filtered.map((worker) => {
            const isActive = worker.active !== false;
            const dept = worker.customDepartment || worker.department;
            const initials = worker.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <View key={worker._id} className={`bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 ${!isActive ? 'opacity-60' : ''}`}>
                <View className="flex-row justify-between items-start">
                  <View className="flex-row flex-1">
                    <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Text className={`font-bold text-sm ${isActive ? 'text-primary-700' : 'text-gray-500'}`}>{initials}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="font-semibold text-gray-900">{worker.name}</Text>
                      <View className={`mt-1 self-start px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Text className={`text-[10px] font-medium ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>{dept}</Text>
                      </View>
                      <View className="flex-row flex-wrap mt-2 items-center">
                        {worker.memberId ? (
                          <Text className="text-xs text-gray-500 mr-3 mb-1"><Ionicons name="card-outline" size={12}/> {worker.memberId}</Text>
                        ) : null}
                        {worker.phone ? (
                          <Text className="text-xs text-gray-500 mr-3 mb-1"><Ionicons name="call-outline" size={12}/> {worker.phone}</Text>
                        ) : null}
                        <Text className="text-xs font-semibold text-gray-700 mb-1">{formatCurrency(worker.rate)}/shift</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row">
                    <TouchableOpacity onPress={() => handleToggle(worker)} className="w-8 h-8 rounded-xl items-center justify-center mr-1 bg-gray-50">
                      <Ionicons name="swap-horizontal" size={18} color={isActive ? "#16a34a" : "#9ca3af"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit(worker)} className="w-8 h-8 rounded-xl items-center justify-center mr-1 bg-primary-50">
                      <Ionicons name="pencil" size={18} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteTarget(worker)} className="w-8 h-8 rounded-xl items-center justify-center bg-red-50">
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-surface">
          <View className="p-4 border-b border-gray-200 bg-white flex-row justify-between items-center">
            <Text className="text-lg font-bold">{editWorker ? 'Edit Worker' : 'Add New Worker'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View className="space-y-4">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Full Name *</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  placeholder="Worker name"
                />
              </View>
              {/* Note: In a real Expo project, we'd use @react-native-picker/picker, but we'll use a simpler TextInput for department in this replica to avoid extra dependency issues, or we'll just install it. */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Department *</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  value={form.department}
                  onChangeText={(text) => setForm({ ...form, department: text })}
                  placeholder="e.g., Mistry, Labour"
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Rate / Shift (₹) *</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  value={form.rate}
                  onChangeText={(text) => setForm({ ...form, rate: text })}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Member ID</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  value={form.memberId}
                  onChangeText={(text) => setForm({ ...form, memberId: text })}
                  placeholder="e.g. W001"
                />
              </View>
              <TouchableOpacity onPress={handleSubmit} className="bg-primary-600 rounded-xl py-3.5 mt-4 items-center">
                <Text className="text-white font-semibold text-base">{editWorker ? 'Save Changes' : 'Add Worker'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm items-center">
            <View className="w-14 h-14 bg-red-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="trash" size={28} color="#ef4444" />
            </View>
            <Text className="text-lg font-bold text-gray-900">Delete {deleteTarget?.name}?</Text>
            <Text className="text-sm text-gray-500 mt-1 mb-6 text-center">This action cannot be undone.</Text>
            <View className="flex-row space-x-3 w-full">
              <TouchableOpacity onPress={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 py-3 rounded-xl items-center">
                <Text className="font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="flex-1 bg-red-500 py-3 rounded-xl items-center ml-3">
                <Text className="font-medium text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
