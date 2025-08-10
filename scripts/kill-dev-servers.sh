#!/bin/bash

echo "🔍 Searching for processes using development ports..."

# Check port 3000 (React frontend)
echo "Port 3000 (Frontend):"
lsof -i :3000 2>/dev/null || echo "  No process found"

# Check port 3001 (Backend API)
echo "Port 3001 (Backend):"
lsof -i :3001 2>/dev/null || echo "  No process found"

# Check port 8000 (DynamoDB Local)
echo "Port 8000 (DynamoDB):"
lsof -i :8000 2>/dev/null || echo "  No process found"

echo ""
echo "🛑 Killing development server processes..."

# Kill processes on development ports
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Killed process on port 3000" || echo "❌ No process on port 3000"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✅ Killed process on port 3001" || echo "❌ No process on port 3001"

# Kill npm processes
pkill -f "npm run dev" 2>/dev/null && echo "✅ Killed npm dev processes" || echo "❌ No npm dev processes"

echo ""
echo "🔄 Ready to restart development servers!"
echo "Run: npm run dev"