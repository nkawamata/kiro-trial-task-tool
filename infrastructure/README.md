# Task Manager Infrastructure

This directory contains AWS CDK code to deploy the Task Manager application using AWS App Runner with external KMS encryption.

## Architecture

- **App Runner**: Hosts containerized Node.js backend from ECR
- **ECR**: Private container registry with KMS encryption
- **CloudFront + S3**: Serves the React frontend
- **DynamoDB**: Three tables (Projects, Tasks, Users) with KMS encryption
- **OpenID Connect**: Generic OIDC authentication (Auth0, Okta, Azure AD, etc.)
- **KMS**: External key for encryption (configurable)

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js 18+ installed
3. Docker installed and running
4. AWS CDK CLI installed: `npm install -g aws-cdk`
5. External KMS key ARN (optional)

## Setup

1. Install dependencies:
```bash
cd infrastructure
npm install
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Configuration

Set environment variables or CDK context:

```bash
# OIDC Configuration (Required)
export OIDC_ISSUER_URL="https://your-oidc-provider.com"
export OIDC_CLIENT_ID="your-client-id"
export OIDC_CLIENT_SECRET="your-client-secret"

# ECR Configuration (Optional)
export ECR_REPOSITORY_NAME="task-manager-backend-dev"
export IMAGE_TAG="latest"

# Optional
export KMS_KEY_ARN="arn:aws:kms:region:account:key/key-id"
export DOMAIN_NAME="yourdomain.com"
export ENVIRONMENT="dev"
```

Or use CDK context:
```bash
cdk deploy -c kmsKeyArn=arn:aws:kms:region:account:key/key-id -c environment=prod
```

## Deployment

### Development Environment
```bash
./scripts/deploy.sh
```

### Production Environment
```bash
ENVIRONMENT=prod ./scripts/deploy.sh
```

### With Custom Configuration
```bash
ENVIRONMENT=prod \
ECR_REPOSITORY_NAME=my-backend \
IMAGE_TAG=v1.0.0 \
KMS_KEY_ARN="arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012" \
./scripts/deploy.sh
```

## Container Configuration

The backend uses Docker containers with:
- Multi-stage build for optimization
- Node.js 18 Alpine base image
- Non-root user for security
- Built-in health checks
- KMS-encrypted ECR storage

## Security Features

- KMS encryption for DynamoDB tables and ECR repository
- External KMS key support
- IAM roles with least privilege
- Private ECR repository with vulnerability scanning
- Generic OpenID Connect authentication
- CloudFront for HTTPS termination
- S3 bucket with encryption
- Non-root container execution

## Outputs

After deployment, the stack outputs:
- OIDC Issuer URL and Client ID
- App Runner service URL
- ECR repository URI and name
- CloudFront distribution URL
- DynamoDB table names
- KMS key ID
- S3 bucket name

## Cleanup

```bash
npm run destroy
```

## Monitoring

The stack includes:
- CloudWatch logs for App Runner
- DynamoDB metrics
- CloudFront access logs (optional)

## Cost Optimization

- DynamoDB on-demand billing
- App Runner auto-scaling
- CloudFront caching
- S3 lifecycle policies (configurable)

## Troubleshooting

1. **App Runner build fails**: Check `apprunner.yaml` configuration
2. **KMS permissions**: Ensure the external KMS key allows CDK operations
3. **GitHub access**: Verify repository URL and branch name
4. **DynamoDB access**: Check IAM role permissions

## Environment Variables for Backend

The App Runner service automatically configures these environment variables:
- `OIDC_ISSUER_URL` - OpenID Connect provider URL
- `OIDC_CLIENT_ID` - OAuth2 client ID
- `OIDC_CLIENT_SECRET` - OAuth2 client secret
- `OIDC_REDIRECT_URI` - Authentication callback URL
- `DYNAMODB_PROJECTS_TABLE` - DynamoDB projects table name
- `DYNAMODB_TASKS_TABLE` - DynamoDB tasks table name
- `DYNAMODB_USERS_TABLE` - DynamoDB users table name
- `KMS_KEY_ID` - KMS encryption key ID
- `AWS_REGION` - AWS region

These are automatically configured through the CDK stack.