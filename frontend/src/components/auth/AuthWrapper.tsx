import React from 'react';
import { useAuth } from 'react-oidc-context';
import { 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Typography, 
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon, Login as LoginIcon } from '@mui/icons-material';

export const AuthWrapper: React.FC = () => {
  const auth = useAuth();

  const handleSignIn = () => {
    auth.signinRedirect();
  };

  if (auth.isLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Loading...</Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Task Manager
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in with OpenID Connect to access your projects
              </Typography>
            </Box>

            {auth.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Authentication error: {auth.error.message}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleSignIn}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Sign In with OpenID Connect
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              You will be redirected to your identity provider to sign in securely.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};