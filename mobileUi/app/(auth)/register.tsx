import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      Alert.alert('Success', 'Account created! Please sign in.');
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Registration Failed', err?.response?.data?.message || 'Something went wrong.');
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
          <Text className="text-primary-200 text-sm mt-1">Create your account</Text>
        </View>

        <View className="bg-white rounded-3xl shadow-lg p-8">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Get started</Text>
            <Text className="text-gray-500 text-sm mt-1">Create your free account</Text>
          </View>

          <View className="space-y-4">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Full Name</Text>
              <View className="relative flex-row items-center">
                <View className="absolute left-4 z-10">
                  <Ionicons name="person" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                  placeholder="John Doe"
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                />
              </View>
            </View>

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

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Password</Text>
              <View className="relative flex-row items-center">
                <View className="absolute left-4 z-10">
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" />
             </View>
                <TextInput
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                  placeholder="Min 6 characters"
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

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Confirm Password</Text>
              <View className="relative flex-row items-center">
                <View className="absolute left-4 z-10">
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white"
                  placeholder="Repeat password"
                  placeholderTextColor="#9ca3af"
                  value={form.confirm}
                  onChangeText={(text) => setForm({ ...form, confirm: text })}
                  secureTextEntry={true}
                />
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
                {loading ? 'Creating account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-gray-500">Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary-600 font-semibold">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
