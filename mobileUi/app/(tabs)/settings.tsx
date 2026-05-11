import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { locationService } from '../../services/locationService';

export default function Settings() {
  const { user, locations, fetchLocations, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showLocModal, setShowLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLocations();
    setRefreshing(false);
  }, [fetchLocations]);

  const openAdd = () => {
    setEditLoc(null);
    setForm({ name: '', address: '' });
    setShowLocModal(true);
  };

  const openEdit = (loc) => {
    setEditLoc(loc);
    setForm({ name: loc.name, address: loc.address || '' });
    setShowLocModal(true);
  };

  const handleSaveLoc = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      if (editLoc) {
        await locationService.update(editLoc._id, form);
        Alert.alert('Success', 'Location updated');
      } else {
        await locationService.create(form);
        Alert.alert('Success', 'Location added');
      }
      setShowLocModal(false);
      fetchLocations();
    } catch {
      Alert.alert('Error', 'Failed to save location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLoc = (id) => {
    Alert.alert(
      'Delete Location',
      'Delete this location? This might affect associated workers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await locationService.delete(id);
              Alert.alert('Success', 'Location deleted');
              fetchLocations();
            } catch {
              Alert.alert('Error', 'Failed to delete location');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-surface px-4"
      style={{ paddingTop: insets.top + 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
      }
    >
      <View className="mb-6 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        <TouchableOpacity onPress={logout} className="bg-red-50 px-3 py-1.5 rounded-lg flex-row items-center">
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text className="text-red-600 font-medium ml-1 text-sm">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
        <Text className="text-base font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
          Profile Information
        </Text>
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">
              {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-sm text-gray-500">{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Locations Section */}
      <View className="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <Text className="text-base font-semibold text-gray-800">Manage Locations</Text>
          <TouchableOpacity onPress={openAdd} className="bg-primary-50 px-3 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="add" size={16} color="#2563eb" />
            <Text className="text-primary-700 font-medium ml-1 text-sm">Add</Text>
          </TouchableOpacity>
        </View>

        {locations.length === 0 ? (
          <Text className="text-center py-6 text-gray-500 text-sm">No locations added yet.</Text>
        ) : (
          locations.map((loc, index) => (
            <View
              key={loc._id}
              className={`flex-row items-center justify-between py-3 ${
                index !== locations.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                  <Ionicons name="location" size={20} color="#2563eb" />
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-gray-900" numberOfLines={1}>{loc.name}</Text>
                  {loc.address ? (
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{loc.address}</Text>
                  ) : null}
                </View>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => openEdit(loc)} className="w-8 h-8 rounded-lg items-center justify-center bg-primary-50 mr-2">
                  <Ionicons name="pencil" size={16} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLoc(loc._id)} className="w-8 h-8 rounded-lg items-center justify-center bg-red-50">
                  <Ionicons name="trash" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={showLocModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl w-full p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold">{editLoc ? 'Edit Location' : 'Add Location'}</Text>
              <TouchableOpacity onPress={() => setShowLocModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Location Name *</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  placeholder="e.g. Site A"
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                />
              </View>
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Address</Text>
                <TextInput
                  className="input px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  placeholder="e.g. 123 Main St"
                  value={form.address}
                  onChangeText={(text) => setForm({ ...form, address: text })}
                />
              </View>

              <View className="flex-row space-x-3 w-full">
                <TouchableOpacity onPress={() => setShowLocModal(false)} className="flex-1 bg-gray-100 py-3.5 rounded-xl items-center">
                  <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveLoc} className="flex-1 bg-primary-600 py-3.5 rounded-xl items-center ml-3">
                  <Text className="font-medium text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
