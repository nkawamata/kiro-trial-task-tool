#!/bin/bash

# Test script for auto user creation feature
# This script helps test the OIDC auto user creation functionality

echo "🚀 Testing Auto User Creation Feature"
echo "======================================"

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Environment variable $1 is not set"
        return 1
    else
        echo "✅ $1 is set"
        return 0
    fi
}

echo ""
echo "📋 Checking Backend Environment Variables..."
cd backend

# Check backend environment variables
ENV_VARS=(
    "OIDC_ISSUER_URL"
    "OIDC_CLIENT_ID"
    "AUTO_CREATE_USERS"
)

for var in "${ENV_VARS[@]}"; do
    if ! check_env_var "$var"; then
        echo "Please set $var in backend/.env"
        exit 1
    fi
done

echo ""
echo "📋 Checking Frontend Environment Variables..."
cd ../frontend

# Check frontend environment variables
FRONTEND_ENV_VARS=(
    "REACT_APP_OIDC_ISSUER_URL"
    "REACT_APP_OIDC_CLIENT_ID"
    "REACT_APP_OIDC_REDIRECT_URI"
)

for var in "${FRONTEND_ENV_VARS[@]}"; do
    if ! check_env_var "$var"; then
        echo "Please set $var in frontend/.env"
        exit 1
    fi
done

cd ..

echo ""
echo "🔍 Testing OIDC Provider Connectivity..."

# Test OIDC discovery endpoint
DISCOVERY_URL="${OIDC_ISSUER_URL}/.well-known/openid-configuration"
echo "Testing: $DISCOVERY_URL"

if curl -s --fail "$DISCOVERY_URL" > /dev/null; then
    echo "✅ OIDC provider is accessible"
else
    echo "❌ OIDC provider is not accessible"
    echo "Please check your OIDC_ISSUER_URL and ensure the provider is running"
    exit 1
fi

echo ""
echo "🔍 Testing JWKS Endpoint..."

# Extract JWKS URI from discovery document
JWKS_URI=$(curl -s "$DISCOVERY_URL" | grep -o '"jwks_uri":"[^"]*' | cut -d'"' -f4)
echo "Testing: $JWKS_URI"

if curl -s --fail "$JWKS_URI" > /dev/null; then
    echo "✅ JWKS endpoint is accessible"
else
    echo "❌ JWKS endpoint is not accessible"
    exit 1
fi

echo ""
echo "🗄️  Checking Database Tables..."

# Check if DynamoDB tables exist
cd backend
if npm run db:create-tables > /dev/null 2>&1; then
    echo "✅ Database tables are ready"
else
    echo "❌ Failed to create database tables"
    echo "Please ensure DynamoDB is running and accessible"
    exit 1
fi

echo ""
echo "🎯 Test Results Summary"
echo "======================"
echo "✅ Environment variables configured"
echo "✅ OIDC provider accessible"
echo "✅ JWKS endpoint accessible"
echo "✅ Database tables ready"
echo ""
echo "🚀 Ready to test auto user creation!"
echo ""
echo "Next steps:"
echo "1. Start the application: npm run dev"
echo "2. Navigate to http://localhost:3000"
echo "3. Click 'Sign In with OpenID Connect'"
echo "4. Complete authentication"
echo "5. Check that user is created in database"
echo ""
echo "To verify user creation, you can:"
echo "- Check application logs for 'Auto-creating user' messages"
echo "- Use AWS CLI to scan the Users table"
echo "- Call GET /api/auth/me endpoint after authentication"

cd ..