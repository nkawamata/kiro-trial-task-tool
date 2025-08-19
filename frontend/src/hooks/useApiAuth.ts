import { useAuth } from 'react-oidc-context';

export const useApiAuth = () => {
  const auth = useAuth();

  const getAuthHeaders = () => {
    if (auth.user?.access_token) {
      return {
        Authorization: `Bearer ${auth.user.access_token}`
      };
    }
    return {};
  };

  return {
    token: auth.user?.access_token || null,
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    getAuthHeaders
  };
};