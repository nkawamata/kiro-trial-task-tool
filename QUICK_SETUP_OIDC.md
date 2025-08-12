# Quick Setup Guide: OIDC Auto User Creation

This guide will help you quickly set up the auto user creation feature with Keycloak for testing.

## Prerequisites

- Docker installed
- Node.js and npm installed
- Application dependencies installed (`npm install`)

## Step 1: Start Keycloak

```bash
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

Wait for Keycloak to start (you'll see "Keycloak started" in the logs).

## Step 2: Configure Keycloak

1. Open http://localhost:8080 in your browser
2. Login with `admin` / `admin`
3. Create a new realm:
   - Click "Create Realm"
   - Name: `taskmanager`
   - Click "Create"

4. Create a client:
   - Go to "Clients" → "Create client"
   - Client ID: `taskmanager-web`
   - Client Type: `OpenID Connect`
   - Click "Next"
   - Client authentication: OFF
   - Authorization: OFF
   - Standard flow: ON
   - Direct access grants: ON
   - Click "Save"

5. Configure client settings:
   - Valid redirect URIs: `http://localhost:3000/callback`
   - Valid post logout redirect URIs: `http://localhost:3000`
   - Web origins: `http://localhost:3000`
   - Click "Save"

6. Create a test user:
   - Go to "Users" → "Add user"
   - Username: `testuser`
   - Email: `test@example.com`
   - First name: `Test`
   - Last name: `User`
   - Email verified: ON
   - Click "Create"
   - Go to "Credentials" tab
   - Click "Set password"
   - Password: `password123`
   - Temporary: OFF
   - Click "Save"

## Step 3: Configure Environment Variables

### Backend (.env)
```bash
# Copy from .env.example and add/update these:
OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
OIDC_CLIENT_ID=taskmanager-web
AUTO_CREATE_USERS=true
```

### Frontend (.env)
```bash
# Copy from .env.example and add/update these:
REACT_APP_OIDC_ISSUER_URL=http://localhost:8080/realms/taskmanager
REACT_APP_OIDC_CLIENT_ID=taskmanager-web
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback
REACT_APP_OIDC_SCOPE=openid profile email
```

## Step 4: Setup Database

```bash
# Start DynamoDB Local (if not already running)
npm run start:dynamodb

# Create tables
cd backend
npm run db:create-tables
cd ..
```

## Step 5: Test the Setup

```bash
# Run the test script
./scripts/test-auto-user-creation.sh
```

If all checks pass, proceed to step 6.

## Step 6: Start the Application

```bash
# Start both frontend and backend
npm run dev
```

## Step 7: Test Auto User Creation

1. Open http://localhost:3000
2. Click "Sign In with OpenID Connect"
3. You'll be redirected to Keycloak
4. Login with:
   - Username: `testuser`
   - Password: `password123`
5. You'll be redirected back to the application
6. Check the backend logs - you should see user creation messages
7. The user should now be created in your DynamoDB Users table

## Verification

### Check Backend Logs
Look for messages like:
```
Auto-creating user for sub: <user-id>
User created successfully: <user-data>
```

### Check Database
```bash
# Scan Users table (if using DynamoDB Local)
aws dynamodb scan \
  --table-name Users \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

### Test API Endpoint
```bash
# Get your access token from browser dev tools (Application → Local Storage)
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/auth/me
```

## Troubleshooting

### Common Issues

1. **CORS Error**: Ensure Keycloak client has correct redirect URIs
2. **Token Invalid**: Check that OIDC_ISSUER_URL matches your Keycloak realm
3. **User Not Created**: Verify AUTO_CREATE_USERS=true in backend .env
4. **Database Error**: Ensure DynamoDB is running and tables exist

### Debug Steps

1. Check Keycloak logs: `docker logs <container-id>`
2. Check application logs in terminal
3. Use browser dev tools to inspect network requests
4. Verify environment variables are loaded correctly

## Next Steps

Once you have the basic setup working:

1. Try different OIDC providers (Auth0, Google, etc.)
2. Test with AUTO_CREATE_USERS=false to see manual creation flow
3. Test user information updates
4. Implement role mapping if needed

## Production Considerations

- Use HTTPS URLs for production
- Store client secrets securely
- Configure proper CORS settings
- Set up monitoring and logging
- Consider rate limiting for user creation endpoints