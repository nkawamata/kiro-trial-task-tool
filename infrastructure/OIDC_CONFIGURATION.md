# OpenID Connect Configuration

## Overview

The Task Manager application now uses **generic OpenID Connect (OIDC)** authentication instead of AWS Cognito. This allows integration with any OIDC-compliant identity provider such as:

- **Auth0**
- **Okta**
- **Azure AD**
- **Google Identity**
- **Keycloak**
- **Custom OIDC providers**

## Configuration

### Environment Variables

The application requires these OIDC environment variables:

```bash
# Required OIDC Configuration
OIDC_ISSUER_URL="https://your-provider.com"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"

# Optional
OIDC_REDIRECT_URI="https://yourdomain.com/auth/callback"
```

### CDK Configuration

Set these when deploying:

```bash
# Via Environment Variables
export OIDC_ISSUER_URL="https://auth0.example.com"
export OIDC_CLIENT_ID="abc123xyz"
export OIDC_CLIENT_SECRET="secret123"

# Deploy
cdk deploy TaskManager-dev
```

Or via CDK context:

```bash
cdk deploy -c oidcIssuerUrl=https://auth0.example.com \
           -c oidcClientId=abc123xyz \
           -c oidcClientSecret=secret123
```

## Provider-Specific Examples

### Auth0 Configuration

```bash
OIDC_ISSUER_URL="https://your-tenant.auth0.com"
OIDC_CLIENT_ID="your-auth0-client-id"
OIDC_CLIENT_SECRET="your-auth0-client-secret"
```

**Auth0 Application Settings:**
- Application Type: Regular Web Application
- Allowed Callback URLs: `https://yourdomain.com/auth/callback`
- Allowed Logout URLs: `https://yourdomain.com/auth/logout`

### Okta Configuration

```bash
OIDC_ISSUER_URL="https://your-org.okta.com/oauth2/default"
OIDC_CLIENT_ID="your-okta-client-id"
OIDC_CLIENT_SECRET="your-okta-client-secret"
```

**Okta Application Settings:**
- Application Type: Web Application
- Grant Types: Authorization Code
- Sign-in redirect URIs: `https://yourdomain.com/auth/callback`

### Azure AD Configuration

```bash
OIDC_ISSUER_URL="https://login.microsoftonline.com/{tenant-id}/v2.0"
OIDC_CLIENT_ID="your-azure-client-id"
OIDC_CLIENT_SECRET="your-azure-client-secret"
```

**Azure AD App Registration:**
- Platform: Web
- Redirect URI: `https://yourdomain.com/auth/callback`
- ID tokens: Enabled

### Google Identity Configuration

```bash
OIDC_ISSUER_URL="https://accounts.google.com"
OIDC_CLIENT_ID="your-google-client-id.googleusercontent.com"
OIDC_CLIENT_SECRET="your-google-client-secret"
```

**Google Cloud Console:**
- Application Type: Web application
- Authorized redirect URIs: `https://yourdomain.com/auth/callback`

## Backend Integration

The backend will use the `openid-client` library for OIDC integration:

```javascript
const { Issuer } = require('openid-client');

// Discover OIDC configuration
const issuer = await Issuer.discover(process.env.OIDC_ISSUER_URL);

// Create client
const client = new issuer.Client({
  client_id: process.env.OIDC_CLIENT_ID,
  client_secret: process.env.OIDC_CLIENT_SECRET,
  redirect_uris: [process.env.OIDC_REDIRECT_URI],
  response_types: ['code'],
});

// Generate authorization URL
const authUrl = client.authorizationUrl({
  scope: 'openid email profile',
  state: 'random-state',
});

// Handle callback
const tokenSet = await client.callback(
  process.env.OIDC_REDIRECT_URI,
  { code: 'auth-code' },
  { state: 'random-state' }
);

// Verify and decode JWT
const userinfo = await client.userinfo(tokenSet.access_token);
```

## Frontend Integration

Frontend authentication flow:

```javascript
// Redirect to OIDC provider
const authUrl = `${API_BASE_URL}/auth/login`;
window.location.href = authUrl;

// Handle callback (automatic)
// User will be redirected back with tokens

// Check authentication status
const response = await fetch(`${API_BASE_URL}/auth/me`, {
  credentials: 'include'
});
const user = await response.json();
```

## App Runner Environment Variables

The CDK automatically configures these environment variables in App Runner:

```yaml
# Automatically set by CDK
NODE_ENV: production
PORT: 3001
AWS_REGION: us-east-1
DYNAMODB_PROJECTS_TABLE: task-manager-projects-dev
DYNAMODB_TASKS_TABLE: task-manager-tasks-dev
DYNAMODB_USERS_TABLE: task-manager-users-dev
KMS_KEY_ID: your-kms-key-id

# OIDC Configuration (from CDK config)
OIDC_ISSUER_URL: https://your-provider.com
OIDC_CLIENT_ID: your-client-id
OIDC_CLIENT_SECRET: your-client-secret
OIDC_REDIRECT_URI: https://yourdomain.com/auth/callback
```

## Security Considerations

1. **Client Secret**: Store securely, never expose in frontend
2. **State Parameter**: Use random state for CSRF protection
3. **HTTPS Only**: Always use HTTPS in production
4. **Token Validation**: Verify JWT signatures and claims
5. **Scope Limitation**: Request minimal required scopes

## Authentication Flow

1. **User Login**: Redirect to OIDC provider
2. **Authorization**: User authenticates with provider
3. **Callback**: Provider redirects back with authorization code
4. **Token Exchange**: Backend exchanges code for tokens
5. **User Info**: Backend retrieves user information
6. **Session**: Backend creates session/JWT for frontend

## Deployment

```bash
# Set OIDC configuration
export OIDC_ISSUER_URL="https://your-provider.com"
export OIDC_CLIENT_ID="your-client-id"
export OIDC_CLIENT_SECRET="your-client-secret"

# Deploy infrastructure
cd infrastructure
npm run build
cdk deploy TaskManager-dev

# Verify configuration
aws apprunner describe-service --service-arn <service-arn>
```

## Troubleshooting

### Common Issues

1. **Invalid Issuer URL**: Ensure URL is correct and accessible
2. **Client Credentials**: Verify client ID and secret are correct
3. **Redirect URI Mismatch**: Ensure callback URL matches provider config
4. **Scope Issues**: Check required scopes are requested
5. **Token Validation**: Verify JWT signature and claims

### Debug Commands

```bash
# Test OIDC discovery
curl https://your-provider.com/.well-known/openid-configuration

# Check App Runner environment
aws apprunner describe-service --service-arn <arn> \
  --query 'Service.SourceConfiguration.CodeRepository.CodeConfiguration.CodeConfigurationValues.RuntimeEnvironmentVariables'

# View App Runner logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
```

The application is now configured for generic OpenID Connect authentication! 🎉