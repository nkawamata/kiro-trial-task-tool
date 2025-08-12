#!/bin/bash

# Debug script to test user search functionality
echo "🔍 Debug User Search"
echo "==================="

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 3001"
    echo "Please start the backend with: npm run dev"
    exit 1
fi

echo "✅ Backend is running"

# You need to provide your access token for testing
if [ -z "$ACCESS_TOKEN" ]; then
    echo ""
    echo "To test the user search, you need to provide your access token:"
    echo "1. Login to the application"
    echo "2. Open browser dev tools → Application → Local Storage"
    echo "3. Find your access token"
    echo "4. Run: ACCESS_TOKEN='your-token-here' ./scripts/debug-user-search.sh"
    echo ""
    echo "Or test without authentication (will show auth error):"
    echo ""
fi

echo ""
echo "🔍 Testing user search endpoints..."

# Test debug endpoint to list all users
echo ""
echo "1. Listing all users in database:"
if [ -n "$ACCESS_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
         http://localhost:3001/api/team/users/debug/all | jq '.'
else
    curl -s http://localhost:3001/api/team/users/debug/all | jq '.'
fi

echo ""
echo "2. Searching for 'gmail':"
if [ -n "$ACCESS_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
         "http://localhost:3001/api/team/users/search?q=gmail" | jq '.'
else
    curl -s "http://localhost:3001/api/team/users/search?q=gmail" | jq '.'
fi

echo ""
echo "3. Searching for '@':"
if [ -n "$ACCESS_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
         "http://localhost:3001/api/team/users/search?q=@" | jq '.'
else
    curl -s "http://localhost:3001/api/team/users/search?q=@" | jq '.'
fi

echo ""
echo "Check the backend logs for detailed debug information."