import React from 'react';
import { useAuth } from 'react-oidc-context';
import { Box, Typography, Paper, Button } from '@mui/material';

export const AuthDebug: React.FC = () => {
  const auth = useAuth();

  const handleTestAPI = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/test');
      const data = await response.json();
      console.log('Test API response:', data);
    } catch (error) {
      console.error('Test API error:', error);
    }
  };

  const handleTestAuthAPI = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${auth.user?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Auth API response:', data);
    } catch (error) {
      console.error('Auth API error:', error);
    }
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Auth Debug Info
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Is Authenticated:</strong> {auth.isAuthenticated ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Is Loading:</strong> {auth.isLoading ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Has User:</strong> {auth.user ? 'Yes' : 'No'}
        </Typography>
        {auth.user && (
          <Typography variant="body2">
            <strong>User Keys:</strong> {Object.keys(auth.user).join(', ')}
          </Typography>
        )}
        {auth.user?.access_token && (
          <Typography variant="body2">
            <strong>Access Token:</strong> {auth.user.access_token.substring(0, 20)}...
          </Typography>
        )}
        {auth.error && (
          <Typography variant="body2" color="error">
            <strong>Error:</strong> {auth.error.message}
          </Typography>
        )}
      </Box>

      <Button variant="outlined" onClick={handleTestAPI} sx={{ mr: 1 }}>
        Test Backend
      </Button>
      
      {auth.user?.access_token && (
        <Button variant="outlined" onClick={handleTestAuthAPI} sx={{ mr: 1 }}>
          Test Auth API
        </Button>
      )}
      
      {!auth.isAuthenticated && (
        <Button variant="contained" onClick={() => auth.signinRedirect()}>
          Sign In
        </Button>
      )}
      
      {auth.isAuthenticated && (
        <Button variant="outlined" onClick={() => auth.signoutRedirect()}>
          Sign Out
        </Button>
      )}
    </Paper>
  );
};