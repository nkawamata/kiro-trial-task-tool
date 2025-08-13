#!/bin/bash

# Start DynamoDB Local
echo "Starting DynamoDB Local..."

# Check if DynamoDB Local directory exists
if [ ! -d "infrastructure/dynamodb-local" ]; then
    echo "DynamoDB Local not found. Please run the setup first."
    exit 1
fi

# Check if already running
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "DynamoDB Local is already running on port 8000"
    exit 0
fi

# Start DynamoDB Local
cd infrastructure/dynamodb-local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -inMemory -port 8000 &

# Wait a moment for it to start
sleep 3

# Check if it started successfully
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ DynamoDB Local started successfully on port 8000"
else
    echo "❌ Failed to start DynamoDB Local"
    exit 1
fi