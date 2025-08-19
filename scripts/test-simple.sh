#!/bin/bash

# Simple Test Runner - focuses on working tests only
set -e

echo "🧪 Running Simple Test Suite..."

# Test frontend utilities and services with high coverage
echo "📱 Testing Frontend Utils and Services..."
cd frontend
npm test -- --testPathPattern="(utils|services)/__tests__/" --watchAll=false --verbose
cd ..

echo "🖥️  Testing Backend Utils and Config..."
cd backend
npm test -- --testPathPattern="__tests__/(setup|utils|config)" --verbose
cd ..

echo "✅ Simple tests completed!"