import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
   baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
