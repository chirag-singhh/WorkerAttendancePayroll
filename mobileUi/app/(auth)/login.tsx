import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary-700"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4 border border-white/30">
            <Text className="text-white font-black text-2xl">WP</Text>
          </View>
          <Text className="text-3xl font-black text-white">WorkerPay</Text>
          <Text className="text-primary-200 text-sm mt-1">Attendance & Payroll Management</Text>
        </View>

        <View className="bg-white rounded-3xl shadow-lg p-8">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Welcome back</Text>
            <Text className="text-gray-500 text-sm mt-1">Sign in to your account</Text>
          </View>

          <View className="space-y-4">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email Address</Text>
              <View className="relative flex-row items-center">
                <View className="absolute left-4 z-10">
                  <Ionicons name="mail" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  value={form.email}
                  onChangeText={(text) => setForm({ ...form, email: text })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
              <View className="relative flex-row items-center">
                <View className="absolute left-4 z-10">
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                  placeholder="Enter password"
                  placeholderTextColor="#9ca3af"
                  value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  className="absolute right-4 z-10"
                >
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-primary-600 rounded-xl py-3.5 flex-row justify-center items-center active:bg-primary-700"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" className="mr-2" />
              ) : null}
              <Text className="text-white text-base font-semibold">
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-gray-500">Don't have an account? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary-600 font-semibold">Create account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
