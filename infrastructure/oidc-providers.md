# OpenID Connect Provider Setup Guide

This guide shows how to configure different OIDC providers for your task management application.

## 🔧 **Keycloak (Self-hosted)**

### Setup Steps:
1. **Install Keycloak** (Docker):
   ```bash
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Create Realm**:
   - Go to http://localhost:8080
   - Login with admin/admin
   - Create new realm: `taskmanager`

3. **Create Client**:
   - Client ID: `taskmanager-web`
   - Client Type: `OpenID Connect`
   - Valid redirect URIs: `http://localhost:3000/callback`
   - Web origins: `http://localhost:3000`

4. **Environment Variables**:
   ```bash
   # Backend .env
   OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
   OIDC_CLIENT_ID=taskmanager-web
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_REDIRECT_URI=http://localhost:3000/callback

   # Frontend .env
   REACT_APP_OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
   REACT_APP_OIDC_CLIENT_ID=taskmanager-web
   REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
   REACT_APP_OIDC_SCOPE=openid profile email
   ```

## 🔧 **Auth0**

### Setup Steps:
1. **Create Auth0 Account**: https://auth0.com
2. **Create Application**:
   - Type: Single Page Application
   - Allowed Callback URLs: `http://localhost:3000/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`

3. **Environment Variables**:
   ```bash
   # Backend .env
   OIDC_ISSUER_URL=https://your-domain.auth0.com
   OIDC_CLIENT_ID=your-client-id
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_REDIRECT_URI=http://localhost:3000/callback

   # Frontend .env
   REACT_APP_OIDC_ISSUER_URL=https://your-domain.auth0.com
   REACT_APP_OIDC_CLIENT_ID=your-client-id
   REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
   REACT_APP_OIDC_SCOPE=openid profile email
   ```

## 🔧 **Google OAuth**

### Setup Steps:
1. **Google Cloud Console**: https://console.cloud.google.com
2. **Enable Google+ API**
3. **Create OAuth 2.0 Credentials**:
   - Authorized redirect URIs: `http://localhost:3000/callback`

4. **Environment Variables**:
   ```bash
   # Backend .env
   OIDC_ISSUER_URL=https://accounts.google.com
   OIDC_CLIENT_ID=your-google-client-id.googleusercontent.com
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_REDIRECT_URI=http://localhost:3000/callback

   # Frontend .env
   REACT_APP_OIDC_ISSUER_URL=https://accounts.google.com
   REACT_APP_OIDC_CLIENT_ID=your-google-client-id.googleusercontent.com
   REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
   REACT_APP_OIDC_SCOPE=openid profile email
   ```

## 🔧 **Microsoft Azure AD**

### Setup Steps:
1. **Azure Portal**: https://portal.azure.com
2. **App Registrations** → **New registration**
3. **Configure**:
   - Redirect URI: `http://localhost:3000/callback`
   - Platform: Single-page application

4. **Environment Variables**:
   ```bash
   # Backend .env
   OIDC_ISSUER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
   OIDC_CLIENT_ID=your-application-id
   OIDC_CLIENT_SECRET=your-client-secret
   OIDC_REDIRECT_URI=http://localhost:3000/callback

   # Frontend .env
   REACT_APP_OIDC_ISSUER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
   REACT_APP_OIDC_CLIENT_ID=your-application-id
   REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
   REACT_APP_OIDC_SCOPE=openid profile email
   ```

## 🧪 **Testing Setup**

### Quick Keycloak Test:
```bash
# Start Keycloak
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev

# Update your .env files with Keycloak settings
# Start your application
npm run dev
```

### Create Test Users:
1. Go to Keycloak Admin Console
2. Users → Add user
3. Set username: `john@example.com`
4. Credentials → Set password: `password123`
5. Email verified: ON

## 🔍 **Troubleshooting**

### Common Issues:
1. **CORS errors**: Check allowed origins in OIDC provider
2. **Redirect mismatch**: Ensure callback URLs match exactly
3. **Token validation fails**: Verify issuer URL and client ID
4. **Scopes missing**: Ensure `openid profile email` scopes are requested

### Debug Commands:
```bash
# Check OIDC discovery endpoint
curl https://your-oidc-provider.com/.well-known/openid-configuration

# Verify JWKS endpoint
curl https://your-oidc-provider.com/.well-known/jwks.json
```

## 🚀 **Production Considerations**

1. **HTTPS**: Use HTTPS URLs for production
2. **Secrets**: Store client secrets securely
3. **Scopes**: Request minimal required scopes
4. **Token refresh**: Implement token refresh logic
5. **Logout**: Configure proper logout URLs