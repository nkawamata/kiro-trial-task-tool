# DynamoDB Local Setup

This document explains how to set up DynamoDB locally for development.

## Prerequisites

- Java 8 or higher
- Node.js and npm

## Option 1: Using Docker (Recommended)

1. **Start DynamoDB Local with Docker:**
   ```bash
   docker run -p 8000:8000 amazon/dynamodb-local
   ```

2. **Verify it's running:**
   ```bash
   curl http://localhost:8000
   ```

## Option 2: Download and Run Locally

1. **Download DynamoDB Local:**
   ```bash
   curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
   tar -xzf dynamodb_local_latest.tar.gz
   ```

2. **Start DynamoDB Local:**
   ```bash
   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
   ```

## Setup for Development

1. **Set environment variables in `.env`:**
   ```bash
   DYNAMODB_REGION=us-east-1
   DYNAMODB_ENDPOINT=http://localhost:8000
   AWS_ACCESS_KEY_ID=dummy
   AWS_SECRET_ACCESS_KEY=dummy
   ```

2. **Create tables:**
   ```bash
   npm run db:create-tables
   ```

3. **Seed with sample data:**
   ```bash
   npm run db:seed
   ```

## AWS CLI Configuration for Local DynamoDB

If you want to use AWS CLI with local DynamoDB:

```bash
aws configure set aws_access_key_id dummy
aws configure set aws_secret_access_key dummy
aws configure set region us-east-1

# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Scan a table
aws dynamodb scan --table-name TaskManager-Users --endpoint-url http://localhost:8000
```

## Production Setup

For production, remove the `DYNAMODB_ENDPOINT` environment variable and ensure proper AWS credentials are configured:

```bash
# Remove this for production
# DYNAMODB_ENDPOINT=http://localhost:8000

# Set proper AWS credentials
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
DYNAMODB_REGION=us-east-1
```

## Table Structure

The application creates the following tables:

- **TaskManager-Users**: User profiles and authentication data
- **TaskManager-Projects**: Project information and metadata
- **TaskManager-Tasks**: Task details and assignments
- **TaskManager-ProjectMembers**: Project membership and roles
- **TaskManager-Workload**: Time allocation and workload tracking

Each table uses pay-per-request billing mode and includes appropriate Global Secondary Indexes for efficient querying.