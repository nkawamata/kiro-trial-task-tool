# Development Authentication Fix

## Problem
The team workload calendar API requests were failing with 401 Unauthorized errors because the frontend was not sending valid authentication tokens in development mode.

## Root Cause
1. **Backend Auth Middleware**: Required valid OIDC JWT tokens from Cognito
2. **Frontend OIDC**: Not configured or authenticated in development environment
3. **No Development Bypass**: No mechanism to bypass authentication for local development

## Solution Implemented

### 1. Backend Development Auth Bypass
**File: `backend/src/middleware/auth.ts`**

Added a development mode bypass that accepts a special `dev-token`:

```typescript
// Development bypass for testing
if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
  console.log('Using development auth bypass');
  req.user = {
    sub: '662b8362-d1e6-401c-9936-396f77003a11',
    email: 'dev@example.com',
    name: 'Development User',
    // ... other required fields
  } as OIDCTokenPayload;

  // Create a mock database user for development
  if (process.env.AUTO_CREATE_USERS === 'true') {
    const dbUser = await authService.getOrCreateUser({
      cognitoId: '662b8362-d1e6-401c-9936-396f77003a11',
      email: 'dev@example.com',
      name: 'Development User'
    });
    req.dbUser = dbUser;
  }

  return next();
}
```

### 2. Frontend Development Token Setup
**File: `frontend/src/hooks/useApiAuth.ts`**

Modified the auth hook to automatically use development token when not authenticated:

```typescript
useEffect(() => {
  // Development mode bypass
  if (process.env.NODE_ENV === 'development' && !auth.isAuthenticated) {
    console.log('Using development auth token');
    setAuthToken('dev-token');
    return;
  }
  // ... existing OIDC logic
}, [auth.isAuthenticated, auth.user, auth.isLoading]);
```

## Benefits

### 1. **Seamless Development Experience**
- No need to configure OIDC/Cognito for local development
- Automatic authentication bypass in development mode
- Consistent user identity for testing

### 2. **Production Safety**
- Only active when `NODE_ENV === 'development'`
- Production builds still require proper OIDC authentication
- No security compromise in production environments

### 3. **Testing Capabilities**
- Predictable user ID for consistent testing
- Automatic user creation in development database
- Full API access for frontend development

## Testing Results

### Backend Endpoint Test
```bash
curl -X GET "http://localhost:3001/api/workload/test" -H "Authorization: Bearer dev-token"
# Returns: {"message":"Workload table test","itemCount":3,"items":[...]}
```

### Team Daily Workload Test
```bash
curl -X GET "http://localhost:3001/api/workload/team/daily?projectId=034b1cd2-00f8-4b12-a160-32b61293c649&startDate=2025-08-01&endDate=2025-08-31" -H "Authorization: Bearer dev-token"
# Returns: {"dailyWorkload":{"69fabcb8-82ff-4c6b-bdc1-5c22180968a5":{"2025-08-13":8,"2025-08-16":8,"2025-08-18":8}}}
```

## Development User Details

The development bypass creates a consistent test user:
- **User ID**: `662b8362-d1e6-401c-9936-396f77003a11`
- **Email**: `dev@example.com`
- **Name**: `Development User`
- **Cognito ID**: `662b8362-d1e6-401c-9936-396f77003a11`

## Security Considerations

### Development Only
- Bypass only works when `NODE_ENV === 'development'`
- Specific token required (`dev-token`)
- No impact on production security

### Token Validation
- Production still requires valid OIDC JWT tokens
- Full JWKS validation in production
- Audience and issuer validation maintained

## Usage Instructions

### For Developers
1. Ensure `NODE_ENV=development` in backend `.env`
2. Start backend and frontend servers
3. Authentication will be handled automatically
4. No additional configuration required

### For Production
1. Set `NODE_ENV=production`
2. Configure proper OIDC settings
3. Development bypass will be disabled
4. Full authentication required

## Future Improvements

1. **Environment-Specific Configs**: Separate development and production auth configurations
2. **Mock User Management**: Allow switching between different test users
3. **Auth Testing Tools**: Create utilities for testing different auth scenarios
4. **Documentation**: Add setup guides for different development environments