import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}
