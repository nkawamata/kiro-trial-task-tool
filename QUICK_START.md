# Task Manager - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

1. **AWS Account** with CLI configured
2. **Docker** installed and running
3. **Node.js 18+** installed
4. **OIDC Provider** (Auth0, Okta, Azure AD, Google, etc.)

### Step 1: Clone and Setup

```bash
git clone <your-repo-url>
cd task-tools

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../infrastructure && npm install
```

### Step 2: Configure OIDC Provider

Choose your provider and get credentials:

#### Auth0 Setup
1. Create Auth0 application (Regular Web Application)
2. Set callback URL: `http://localhost:3000/auth/callback`
3. Get Domain, Client ID, and Client Secret

#### Okta Setup
1. Create Okta application (Web Application)
2. Set redirect URI: `http://localhost:3000/auth/callback`
3. Get Issuer URL, Client ID, and Client Secret

#### Azure AD Setup
1. Register Azure AD application
2. Set redirect URI: `http://localhost:3000/auth/callback`
3. Get Tenant ID, Client ID, and Client Secret

### Step 3: Environment Configuration

```bash
cd infrastructure
cp .env.example .env

# Edit .env with your OIDC credentials
export OIDC_ISSUER_URL="https://your-provider.com"
export OIDC_CLIENT_ID="your-client-id"
export OIDC_CLIENT_SECRET="your-client-secret"
```

### Step 4: Deploy Infrastructure

```bash
cd infrastructure

# Test deployment (optional)
./scripts/test-deployment.sh

# Deploy to development
ENVIRONMENT=dev ./scripts/deploy.sh
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://your-apprunner-url/health

# View stack outputs
aws cloudformation describe-stacks --stack-name TaskManager-dev
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   CloudFront     │    │   App Runner    │
│   (React)       │◄──►│   + S3 Bucket    │◄──►│   (Container)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OIDC Provider │    │   ECR Private    │    │    DynamoDB     │
│   (Auth0/Okta)  │    │   Repository     │    │   (3 Tables)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Development Workflow

### Local Development

```bash
# Start backend locally
cd backend
npm run dev

# Start frontend locally (in another terminal)
cd frontend
npm start
```

### Container Development

```bash
# Build and test container locally
cd backend
docker build -t task-manager-backend .
docker run -p 3001:3001 task-manager-backend

# Test health endpoint
curl http://localhost:3001/health
```

### Deploy Changes

```bash
# Deploy infrastructure changes
cd infrastructure
cdk deploy TaskManager-dev

# Deploy container changes
./scripts/build-and-push.sh
```

## 📋 Available Commands

### Infrastructure Commands

```bash
cd infrastructure

# Deploy everything
./scripts/deploy.sh

# Build and push container only
./scripts/build-and-push.sh

# Test deployment
./scripts/test-deployment.sh

# Destroy infrastructure
./scripts/destroy.sh

# CDK commands
cdk synth          # Generate CloudFormation
cdk diff           # Show changes
cdk deploy         # Deploy stack
cdk destroy        # Delete stack
```

### Backend Commands

```bash
cd backend

npm run dev        # Start development server
npm run build      # Build TypeScript
npm start          # Start production server
npm test           # Run tests
npm run lint       # Lint code
```

### Frontend Commands

```bash
cd frontend

npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Lint code
```

## 🔍 Troubleshooting

### Common Issues

1. **OIDC Configuration Error**
   ```bash
   # Check environment variables
   echo $OIDC_ISSUER_URL
   echo $OIDC_CLIENT_ID
   ```

2. **Docker Build Fails**
   ```bash
   # Check Docker is running
   docker --version
   docker ps
   ```

3. **CDK Deploy Fails**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Bootstrap CDK (first time)
   cdk bootstrap
   ```

4. **App Runner Health Check Fails**
   ```bash
   # Check logs
   aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
   ```

### Debug Commands

```bash
# Check ECR images
aws ecr list-images --repository-name task-manager-backend-dev

# Check App Runner service
aws apprunner describe-service --service-arn <service-arn>

# Check DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `task-manager`)]'
```

## 🎯 Next Steps

1. **Configure OIDC Provider** with your chosen service
2. **Deploy to Development** using the deployment script
3. **Test Authentication** flow with your OIDC provider
4. **Set up CI/CD** using the GitHub Actions workflow
5. **Deploy to Production** with production OIDC credentials

## 📚 Documentation

- `infrastructure/README.md` - Infrastructure overview
- `infrastructure/ECR_DEPLOYMENT.md` - ECR deployment guide
- `infrastructure/OIDC_CONFIGURATION.md` - OIDC setup guide
- `infrastructure/DEPLOYMENT_GUIDE.md` - Complete deployment guide

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the comprehensive documentation
3. Check AWS CloudWatch logs
4. Verify OIDC provider configuration

Happy coding! 🎉