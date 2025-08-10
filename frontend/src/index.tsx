import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from 'react-oidc-context';
import { store } from './store';
import App from './App';

// OIDC Configuration
const oidcConfig = {
  authority: process.env.REACT_APP_OIDC_ISSUER_URL!,
  client_id: process.env.REACT_APP_OIDC_CLIENT_ID!,
  redirect_uri: process.env.REACT_APP_OIDC_REDIRECT_URI!,
  response_type: 'code',
  scope: process.env.REACT_APP_OIDC_SCOPE || 'openid profile email',
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  post_logout_redirect_uri: window.location.origin,
  loadUserInfo: true,
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </AuthProvider>
  </React.StrictMode>
);