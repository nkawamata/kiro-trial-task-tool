# ECR Private Repository Deployment

## Overview

The Task Manager backend now uses **Amazon ECR (Elastic Container Registry)** private repository for container deployment instead of GitHub source code. This provides better security, faster deployments, and more control over the container images.

## Architecture Changes

### Before (GitHub Source)
```
GitHub Repository → App Runner (Build & Deploy)
```

### After (ECR Container)
```
Local Build → ECR Private Repository → App Runner (Deploy)
```

## Benefits

1. **Security**: Private container registry with KMS encryption
2. **Performance**: Pre-built images deploy faster than source builds
3. **Control**: Version control over exact container images
4. **Reliability**: No dependency on external Git repositories during deployment
5. **Scanning**: Automatic vulnerability scanning on push

## Configuration

### Environment Variables

```bash
# ECR Configuration
ECR_REPOSITORY_NAME="task-manager-backend-dev"  # Optional, auto-generated if not set
IMAGE_TAG="latest"                               # Optional, defaults to 'latest'

# OIDC Configuration (still required)
OIDC_ISSUER_URL="https://your-oidc-provider.com"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"
```

### CDK Context

```bash
cdk deploy -c ecrRepositoryName=my-custom-repo \
           -c imageTag=v1.0.0 \
           -c oidcIssuerUrl=https://auth0.example.com
```

## Docker Configuration

### Dockerfile Features

The backend `Dockerfile` includes:

- **Multi-stage build**: Optimized for production
- **Non-root user**: Security best practices
- **Health check**: Built-in health monitoring
- **Alpine Linux**: Minimal attack surface
- **Layer optimization**: Efficient caching

### Build Process

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
CMD ["npm", "start"]
```

## Deployment Process

### 1. Automated Deployment

```bash
# Deploy everything (infrastructure + container)
cd infrastructure
./scripts/deploy.sh
```

This script will:
1. Deploy CDK infrastructure (including ECR repository)
2. Build Docker image
3. Push image to ECR
4. Trigger App Runner deployment

### 2. Manual Steps

#### Step 1: Deploy Infrastructure
```bash
cd infrastructure
npm run build
cdk deploy TaskManager-dev
```

#### Step 2: Build and Push Image
```bash
./scripts/build-and-push.sh
```

#### Step 3: Update App Runner (automatic)
App Runner will automatically deploy the new image.

## ECR Repository

### Repository Configuration

The CDK creates an ECR repository with:

- **Name**: `task-manager-backend-{environment}`
- **Encryption**: KMS encryption using the same key as DynamoDB
- **Scanning**: Vulnerability scanning on push
- **Lifecycle**: Retention policy based on environment

### Repository Permissions

- **App Runner Access Role**: Pull permissions for deployment
- **KMS Encryption**: Access to encryption key
- **Cross-account**: Configurable for multi-account setups

## Build and Push Script

### Features

The `build-and-push.sh` script:

1. **Validates Prerequisites**: AWS CLI, Docker, credentials
2. **Creates Repository**: If it doesn't exist
3. **Builds Image**: Multi-stage Docker build
4. **Tags Images**: Both specific tag and 'latest'
5. **Pushes to ECR**: Authenticated push
6. **Triggers Deployment**: Automatic App Runner update

### Usage

```bash
# Basic usage
./scripts/build-and-push.sh

# With custom environment and tag
ENVIRONMENT=prod IMAGE_TAG=v1.2.3 ./scripts/build-and-push.sh

# With custom repository
ECR_REPOSITORY_NAME=my-backend IMAGE_TAG=latest ./scripts/build-and-push.sh
```

## App Runner Configuration

### Image Repository Settings

```yaml
SourceConfiguration:
  ImageRepository:
    ImageIdentifier: 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager-backend-dev:latest
    ImageRepositoryType: ECR
    ImageConfiguration:
      Port: 3001
      RuntimeEnvironmentVariables:
        - Name: NODE_ENV
          Value: production
        - Name: OIDC_ISSUER_URL
          Value: https://your-provider.com
        # ... other environment variables
```

### Access Role

App Runner uses a dedicated access role with:
- ECR pull permissions
- KMS decrypt permissions for encrypted images

## Environment Variables

App Runner automatically configures:

```bash
# Application
NODE_ENV=production
PORT=3001

# AWS Resources
AWS_REGION=us-east-1
DYNAMODB_PROJECTS_TABLE=task-manager-projects-dev
DYNAMODB_TASKS_TABLE=task-manager-tasks-dev
DYNAMODB_USERS_TABLE=task-manager-users-dev
KMS_KEY_ID=your-kms-key-id

# Authentication
OIDC_ISSUER_URL=https://your-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=https://yourdomain.com/auth/callback
```

## Stack Outputs

After deployment:

```bash
# ECR Information
EcrRepositoryUri: 123456789012.dkr.ecr.us-east-1.amazonaws.com/task-manager-backend-dev
EcrRepositoryName: task-manager-backend-dev

# App Runner
AppRunnerServiceUrl: https://xxx.us-east-1.awsapprunner.com

# Other resources...
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to ECR
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build and push to ECR
        run: |
          cd infrastructure
          ./scripts/build-and-push.sh
        env:
          ENVIRONMENT: prod
          IMAGE_TAG: ${{ github.sha }}
```

## Troubleshooting

### Common Issues

1. **ECR Login Failed**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **Image Not Found**
   ```bash
   aws ecr describe-images --repository-name task-manager-backend-dev --region us-east-1
   ```

3. **App Runner Deployment Failed**
   ```bash
   aws apprunner describe-service --service-arn <service-arn> --region us-east-1
   aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
   ```

4. **Permission Issues**
   - Check App Runner access role has ECR pull permissions
   - Verify KMS key permissions for encrypted repositories

### Debug Commands

```bash
# List ECR repositories
aws ecr describe-repositories --region us-east-1

# Check image tags
aws ecr list-images --repository-name task-manager-backend-dev --region us-east-1

# View App Runner services
aws apprunner list-services --region us-east-1

# Check service status
aws apprunner describe-service --service-arn <arn> --region us-east-1
```

## Security Considerations

1. **Private Repository**: Images are not publicly accessible
2. **KMS Encryption**: Images encrypted at rest
3. **Vulnerability Scanning**: Automatic security scanning
4. **IAM Roles**: Least privilege access
5. **Non-root Container**: Security best practices

The backend is now deployed using ECR private repository with enhanced security and performance! 🐳