import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { setAuthToken, clearAuthToken, apiClient } from '../services/apiClient';


export const useApiAuth = () => {
  const auth = useAuth();

  useEffect(() => {
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
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    token: auth.user?.access_token,
  };
};