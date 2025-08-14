# Task Manager CDK Deployment Guide

## ✅ Fixed Issues

The CDK infrastructure is now fully functional with the following fixes applied:

### 1. App Runner Configuration
- ✅ Fixed App Runner service using L1 constructs (`CfnService`)
- ✅ Corrected health check configuration properties
- ✅ Added proper GitHub repository integration
- ✅ Configured CPU/Memory based on environment

### 2. TypeScript Compilation
- ✅ Fixed tsconfig.json configuration
- ✅ Resolved all TypeScript compilation errors
- ✅ Updated deprecated API usage

### 3. CDK Deprecation Warnings
- ✅ Updated `pointInTimeRecovery` to `pointInTimeRecoverySpecification`
- ✅ Migrated from `S3Origin` to `S3BucketOrigin`
- ✅ Fixed CloudFront origin configuration

## 🚀 Quick Deployment

### Prerequisites
```bash
# Install AWS CDK CLI
npm install -g aws-cdk

# Install Docker
# macOS: brew install docker
# Ubuntu: apt-get install docker.io
# Windows: Download Docker Desktop

# Configure AWS credentials
aws configure

# OIDC Configuration (Required)
export OIDC_ISSUER_URL="https://your-oidc-provider.com"
export OIDC_CLIENT_ID="your-client-id"
export OIDC_CLIENT_SECRET="your-client-secret"

# ECR Configuration (Optional)
export ECR_REPOSITORY_NAME="task-manager-backend-dev"
export IMAGE_TAG="latest"

# Optional: Use external KMS key
export KMS_KEY_ARN="arn:aws:kms:region:account:key/key-id"
```

### Deploy Steps
```bash
# 1. Navigate to infrastructure directory
cd infrastructure

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Synthesize (validate) the stack
cdk synth

# 5. Bootstrap CDK (first time only)
cdk bootstrap

# 6. Deploy infrastructure and container
./scripts/deploy.sh
```

### Manual Deployment Steps
```bash
# 1. Deploy CDK stack only
cdk deploy TaskManager-dev

# 2. Build and push container image
./scripts/build-and-push.sh
```

## 🏗️ Architecture Overview

The CDK stack creates:

1. **App Runner Service**
   - Containerized Node.js 18 application
   - Auto-scaling based on environment
   - Health check at `/health` endpoint
   - ECR private repository integration

2. **DynamoDB Tables**
   - Projects, Tasks, Users tables
   - KMS encryption (external key support)
   - Global Secondary Indexes for queries
   - Point-in-time recovery enabled

3. **OpenID Connect Authentication**
   - Generic OIDC provider integration
   - Support for Auth0, Okta, Azure AD, Google, etc.
   - Configurable via environment variables

4. **CloudFront + S3**
   - Frontend hosting with CDN
   - API proxy to App Runner
   - HTTPS enforcement

5. **IAM Roles & Policies**
   - Least privilege access
   - KMS encryption permissions
   - DynamoDB and Cognito access

## 🔧 Configuration Options

### Environment Variables
```bash
# Required
GITHUB_REPO="your-org/task-manager"
GITHUB_BRANCH="main"

# Optional
KMS_KEY_ARN="arn:aws:kms:region:account:key/key-id"
DOMAIN_NAME="yourdomain.com"
ENVIRONMENT="dev|staging|prod"
```

### CDK Context
```bash
# Deploy with context
cdk deploy -c environment=prod -c kmsKeyArn=arn:aws:kms:...
```

## 📋 Stack Outputs

After deployment, you'll get:
- OIDC Issuer URL and Client ID
- App Runner service URL
- ECR repository URI and name
- CloudFront distribution URL
- DynamoDB table names
- KMS key ID
- S3 bucket name

## 🔍 Verification

### Test the deployment:
```bash
# Check App Runner health
curl https://your-apprunner-url/health

# Verify CloudFront distribution
curl https://your-cloudfront-url

# Check DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `task-manager`)]'
```

## 🧹 Cleanup

```bash
# Destroy the stack
cdk destroy TaskManager-dev

# Or use the script
./scripts/destroy.sh
```

## 🚨 Important Notes

1. **External KMS Key**: If using an external KMS key, ensure it has proper permissions for CDK operations
2. **GitHub Repository**: Make sure the repository URL is correct and accessible
3. **App Runner Configuration**: The `apprunner.yaml` file must be in your repository root
4. **Health Endpoint**: Your backend must have a `/health` endpoint for health checks
5. **Environment Variables**: App Runner will use environment variables from the CDK outputs

## 🔧 Troubleshooting

### Common Issues:
1. **Build Failures**: Check `apprunner.yaml` configuration
2. **KMS Permissions**: Verify external KMS key permissions
3. **GitHub Access**: Ensure repository URL and branch are correct
4. **Health Checks**: Verify `/health` endpoint returns 200 OK

### Debug Commands:
```bash
# Check CDK diff
cdk diff

# Validate template
cdk synth --validate

# Check AWS resources
aws apprunner list-services
aws dynamodb list-tables
aws cognito-idp list-user-pools --max-items 10
```

The infrastructure is now ready for deployment! 🎉