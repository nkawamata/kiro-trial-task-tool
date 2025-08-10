import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

export const AuthCallback: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      // Redirect to dashboard after successful authentication
      navigate('/dashboard', { replace: true });
    } else if (auth.error) {
      // Handle authentication error
      console.error('Authentication error:', auth.error);
      navigate('/', { replace: true });
    }
  }, [auth.isAuthenticated, auth.error, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">
        Completing sign in...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we redirect you to the application.
      </Typography>
    </Box>
  );
};