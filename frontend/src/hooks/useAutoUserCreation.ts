import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { authService } from '../services/authService';
import { User } from '../../../shared/src/types';

export interface UseAutoUserCreationResult {
  dbUser: User | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const useAutoUserCreation = (): UseAutoUserCreationResult => {
  const auth = useAuth();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserCreation = async () => {
    if (!auth.isAuthenticated || !auth.user) {
      setDbUser(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.handleUserLogin(auth.user);
      setDbUser(user);
      
      if (!user) {
        setError('Failed to create or retrieve user account');
      }
    } catch (err) {
      console.error('Auto user creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user account');
      setDbUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !auth.isLoading) {
      handleUserCreation();
    } else if (!auth.isAuthenticated) {
      setDbUser(null);
      setError(null);
    }
  }, [auth.isAuthenticated, auth.user, auth.isLoading]);

  const retry = () => {
    if (auth.isAuthenticated && auth.user) {
      handleUserCreation();
    }
  };

  return {
    dbUser,
    isLoading,
    error,
    retry
  };
};