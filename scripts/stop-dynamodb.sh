#!/bin/bash

# Stop DynamoDB Local
echo "Stopping DynamoDB Local..."

# Find and kill DynamoDB Local process
DYNAMODB_PID=$(ps aux | grep "DynamoDBLocal.jar" | grep -v grep | awk '{print $2}')

if [ -z "$DYNAMODB_PID" ]; then
    echo "DynamoDB Local is not running"
    exit 0
fi

# Kill the process
kill $DYNAMODB_PID

# Wait a moment for graceful shutdown
sleep 2

# Check if process is still running and force kill if necessary
if ps -p $DYNAMODB_PID > /dev/null 2>&1; then
    echo "Force killing DynamoDB Local process..."
    kill -9 $DYNAMODB_PID
    sleep 1
fi

# Verify it's stopped
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "❌ Failed to stop DynamoDB Local"
    exit 1
else
    echo "✅ DynamoDB Local stopped successfully"
fi