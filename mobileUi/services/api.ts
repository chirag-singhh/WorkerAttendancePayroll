import axios from 'axios';
import { router } from 'expo-router';

const api = axios.create({
  // Use your local IP address for physical device or 10.0.2.2 for Android Emulator
  // baseURL: 'http://10.0.2.2:5000/api',
  baseURL: 'https://workerattendancepayroll.onrender.com/api',


  withCredentials: true, // for cookies if backend supports it
  timeout: 5000, // 5 seconds timeout
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
