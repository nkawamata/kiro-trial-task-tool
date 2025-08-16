import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { setAuthToken, clearAuthToken, apiClient } from '../services/apiClient';


export const useApiAuth = () => {
  const auth = useAuth();

  useEffect(() => {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && !auth.isAuthenticated) {
      console.log('Using development auth token');
      setAuthToken('dev-token');
      return;
    }

    if (auth.isAuthenticated && auth.user) {
      // Get access token from the auth context
      const token = auth.user.access_token;
      
      if (token) {
        setAuthToken(token);
      } else {
        clearAuthToken();
      }
    } else {
      clearAuthToken();
    }
  }, [auth.isAuthenticated, auth.user, auth.isLoading]);

  // Also set token immediately if available (not just in useEffect)
  if (auth.isAuthenticated && auth.user?.access_token) {
    const currentAuthHeader = apiClient.defaults.headers.common['Authorization'];
    const expectedAuthHeader = `Bearer ${auth.user.access_token}`;
    
    if (currentAuthHeader !== expectedAuthHeader) {
      setAuthToken(auth.user.access_token);
    }
  } else if (process.env.NODE_ENV === 'development' && !auth.isAuthenticated) {
    // Set development token if not authenticated in development
    const currentAuthHeader = apiClient.defaults.headers.common['Authorization'];
    const expectedAuthHeader = 'Bearer dev-token';
    
    if (currentAuthHeader !== expectedAuthHeader) {
      setAuthToken('dev-token');
    }
  }

  return {
    isAuthenticated: auth.isAuthenticated || (process.env.NODE_ENV === 'development'),
    token: auth.user?.access_token || (process.env.NODE_ENV === 'development' ? 'dev-token' : undefined),
  };
};