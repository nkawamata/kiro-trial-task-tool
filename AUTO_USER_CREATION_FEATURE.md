# Auto User Creation Feature

This document describes the implementation of automatic user creation when users login via OpenID Connect (OIDC).

## Overview

The auto user creation feature automatically creates user records in the application database when users successfully authenticate through any OIDC provider (Keycloak, Auth0, Google, Microsoft Azure AD, etc.). This eliminates the need for manual user provisioning and provides a seamless onboarding experience.

## Features

- **Automatic User Creation**: Users are automatically created in the database upon first login
- **Multi-Provider Support**: Works with any OIDC-compliant provider
- **User Information Extraction**: Intelligently extracts user information from different OIDC token formats
- **Configurable**: Can be enabled/disabled via environment variables
- **Error Handling**: Graceful fallback and retry mechanisms
- **User Synchronization**: Updates user information if it changes in the OIDC provider

## Configuration

### Backend Environment Variables

Add these to your `backend/.env` file:

```bash
# OpenID Connect Configuration
OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
OIDC_CLIENT_ID=taskmanager-web
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/callback

# Auto User Creation
AUTO_CREATE_USERS=true
```

### Frontend Environment Variables

Add these to your `frontend/.env` file:

```bash
# OpenID Connect Configuration
REACT_APP_OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
REACT_APP_OIDC_CLIENT_ID=taskmanager-web
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
REACT_APP_OIDC_SCOPE=openid profile email
```

## How It Works

### Backend Flow

1. **Token Verification**: The auth middleware verifies OIDC tokens using JWKS
2. **Token Type Detection**: Automatically detects Cognito vs standard OIDC tokens
3. **User Information Extraction**: Extracts user info (sub, email, name) from token claims
4. **Auto Creation**: If `AUTO_CREATE_USERS=true`, creates user record if it doesn't exist
5. **User Attachment**: Attaches the database user to the request object

### Frontend Flow

1. **OIDC Authentication**: User authenticates with OIDC provider
2. **Token Storage**: Access token is stored and used for API calls
3. **Auto User Creation Hook**: `useAutoUserCreation` hook handles user creation
4. **Error Handling**: Shows appropriate UI for loading, errors, and retry options

## API Endpoints

### GET /api/auth/me
Returns current user information and creates user if auto-creation is enabled.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "cognitoId": "oidc-sub-claim",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tokenInfo": {
    "sub": "oidc-sub-claim",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/create-user
Manually creates a user (useful when auto-creation is disabled).

### POST /api/auth/sync-user
Synchronizes user data with OIDC provider information.

## Supported OIDC Providers

### Keycloak
```bash
OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
OIDC_CLIENT_ID=taskmanager-web
```

### Auth0
```bash
OIDC_ISSUER_URL=https://your-domain.auth0.com
OIDC_CLIENT_ID=your-client-id
```

### Google OAuth
```bash
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=your-google-client-id.googleusercontent.com
```

### Microsoft Azure AD
```bash
OIDC_ISSUER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OIDC_CLIENT_ID=your-application-id
```

## User Information Mapping

The system intelligently maps OIDC claims to user fields:

| User Field | OIDC Claims (Priority Order) |
|------------|------------------------------|
| `cognitoId` | `sub` |
| `email` | `email`, `username`, `preferred_username` |
| `name` | `name`, `given_name + family_name`, `preferred_username` |

## Error Handling

### Backend Errors
- Invalid tokens return 401 Unauthorized
- User creation errors are logged but don't fail the request
- Graceful fallback to token-only authentication

### Frontend Errors
- Loading states during user creation
- Error messages with retry options
- Fallback to manual user creation

## Security Considerations

1. **Token Validation**: All tokens are verified using JWKS from the OIDC provider
2. **Audience Validation**: Ensures tokens are intended for this application
3. **Issuer Validation**: Verifies tokens come from the configured OIDC provider
4. **Optional Creation**: Auto-creation can be disabled for security-sensitive environments

## Testing

### Setup Test Environment

1. **Start Keycloak** (for testing):
   ```bash
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Configure Keycloak**:
   - Create realm: `taskmanager`
   - Create client: `taskmanager-web`
   - Create test user

3. **Update Environment Variables**:
   ```bash
   # Backend
   OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
   OIDC_CLIENT_ID=taskmanager-web
   AUTO_CREATE_USERS=true

   # Frontend
   REACT_APP_OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
   REACT_APP_OIDC_CLIENT_ID=taskmanager-web
   ```

4. **Test Flow**:
   - Start application: `npm run dev`
   - Navigate to http://localhost:3000
   - Click "Sign In with OpenID Connect"
   - Complete authentication
   - Verify user is created in database

### Manual Testing

1. **Test Auto Creation Enabled**:
   - Set `AUTO_CREATE_USERS=true`
   - Login with new user
   - Verify user appears in database

2. **Test Auto Creation Disabled**:
   - Set `AUTO_CREATE_USERS=false`
   - Login with new user
   - Verify appropriate error message
   - Test manual user creation

3. **Test User Updates**:
   - Change user info in OIDC provider
   - Login again
   - Verify user info is updated

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure callback URLs are configured in OIDC provider
   - Check allowed origins

2. **Token Validation Fails**:
   - Verify OIDC_ISSUER_URL is correct
   - Check JWKS endpoint accessibility
   - Ensure client ID matches

3. **User Creation Fails**:
   - Check database connectivity
   - Verify DynamoDB tables exist
   - Check application logs

### Debug Commands

```bash
# Check OIDC configuration
curl https://your-oidc-provider.com/.well-known/openid-configuration

# Verify JWKS endpoint
curl https://your-oidc-provider.com/.well-known/jwks.json

# Check backend logs
npm run dev # Backend logs will show auth middleware activity
```

## Implementation Files

### Backend
- `backend/src/middleware/auth.ts` - Enhanced auth middleware with auto-creation
- `backend/src/services/authService.ts` - User creation and synchronization
- `backend/src/services/oidcService.ts` - OIDC token handling and provider detection
- `backend/src/routes/auth.ts` - Authentication endpoints

### Frontend
- `frontend/src/services/authService.ts` - Frontend auth service
- `frontend/src/hooks/useAutoUserCreation.ts` - Auto user creation hook
- `frontend/src/components/auth/AuthWrapper.tsx` - Enhanced auth UI with error handling
- `frontend/src/types/oidc.ts` - OIDC type definitions

## Future Enhancements

1. **Role Mapping**: Map OIDC roles/groups to application roles
2. **Profile Pictures**: Support for avatar URLs from OIDC providers
3. **User Attributes**: Support for custom user attributes
4. **Audit Logging**: Track user creation and updates
5. **Bulk User Import**: Import existing users from OIDC provider