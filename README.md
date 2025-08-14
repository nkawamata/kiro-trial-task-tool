# Task Manager

A comprehensive multi-project task management tool with advanced Gantt chart visualization and intelligent workload management capabilities.

## ✨ Features

- **Multi-Project Management**: Organize and switch between multiple projects seamlessly
- **Interactive Gantt Charts**: Visual timeline management with drag-and-drop functionality
- **Workload Distribution**: Intelligent task assignment and capacity management
- **OIDC Authentication**: Secure authentication with Auth0, Okta, Azure AD, Google, and more
- **Real-time Collaboration**: Live updates across team members
- **Advanced Filtering**: Filter tasks by user, project, status, and priority
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   CloudFront     │    │   App Runner    │
│   (React + TS)  │◄──►│   + S3 Bucket    │◄──►│   (Container)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OIDC Provider │    │   ECR Private    │    │    DynamoDB     │
│   (Auth0/Okta)  │    │   Repository     │    │   (3 Tables)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- Custom Gantt chart implementation
- Responsive design with mobile support

**Backend**
- Node.js 18 with Express
- TypeScript for type safety
- OpenID Connect authentication
- AWS SDK v3 for DynamoDB
- Docker containerization

**Infrastructure**
- AWS CDK for Infrastructure as Code
- Amazon ECR for private container registry
- AWS App Runner for serverless containers
- Amazon DynamoDB for data storage
- Amazon CloudFront + S3 for frontend hosting
- AWS KMS for encryption

## 🚀 Quick Start

### Prerequisites

- AWS Account with CLI configured
- Docker installed and running
- Node.js 18+ installed
- OIDC Provider (Auth0, Okta, Azure AD, Google, etc.)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd task-manager
npm run install:all
```

### 2. Configure OIDC Authentication

```bash
cd infrastructure
cp .env.example .env

# Edit .env with your OIDC provider credentials
export OIDC_ISSUER_URL="https://your-provider.com"
export OIDC_CLIENT_ID="your-client-id"
export OIDC_CLIENT_SECRET="your-client-secret"
```

### 3. Deploy to AWS

```bash
# Deploy to development environment
npm run deploy:dev

# Or deploy to production
npm run deploy:prod
```

### 4. Start Local Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

## 📋 Available Scripts

### Root Level Commands

```bash
npm run install:all    # Install all dependencies
npm run dev           # Start frontend and backend
npm run build         # Build all projects
npm run test          # Run all tests
npm run lint          # Lint all code

# Deployment
npm run deploy:dev    # Deploy to development
npm run deploy:prod   # Deploy to production
npm run deploy:test   # Test deployment

# Docker
npm run docker:build  # Build backend container
npm run docker:run    # Run container locally

# CDK
npm run cdk:synth     # Generate CloudFormation
npm run cdk:diff      # Show infrastructure changes
npm run cdk:deploy    # Deploy infrastructure
```

### Individual Project Commands

```bash
# Frontend (React)
cd frontend
npm start             # Development server
npm run build         # Production build
npm test              # Run tests

# Backend (Node.js)
cd backend
npm run dev           # Development server
npm run build         # Build TypeScript
npm start             # Production server

# Infrastructure (CDK)
cd infrastructure
./scripts/deploy.sh   # Full deployment
./scripts/build-and-push.sh  # Container only
cdk synth            # Generate templates
```

## 🔧 Configuration

### OIDC Providers

The application supports multiple OIDC providers:

#### Auth0
```bash
OIDC_ISSUER_URL=https://your-tenant.auth0.com
OIDC_CLIENT_ID=your-auth0-client-id
OIDC_CLIENT_SECRET=your-auth0-client-secret
```

#### Okta
```bash
OIDC_ISSUER_URL=https://your-org.okta.com/oauth2/default
OIDC_CLIENT_ID=your-okta-client-id
OIDC_CLIENT_SECRET=your-okta-client-secret
```

#### Azure AD
```bash
OIDC_ISSUER_URL=https://login.microsoftonline.com/{tenant-id}/v2.0
OIDC_CLIENT_ID=your-azure-client-id
OIDC_CLIENT_SECRET=your-azure-client-secret
```

### Environment Variables

```bash
# Required
OIDC_ISSUER_URL=https://your-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Optional
ENVIRONMENT=dev
ECR_REPOSITORY_NAME=task-manager-backend-dev
IMAGE_TAG=latest
KMS_KEY_ARN=arn:aws:kms:region:account:key/key-id
DOMAIN_NAME=yourdomain.com
```

## 🔒 Security Features

- **Private ECR Repository**: Container images stored securely
- **KMS Encryption**: Data encrypted at rest and in transit
- **OIDC Authentication**: Industry-standard authentication
- **IAM Roles**: Least privilege access control
- **Vulnerability Scanning**: Automatic container security scanning
- **HTTPS Enforcement**: All traffic encrypted via CloudFront

## 📊 Monitoring & Observability

- **CloudWatch Logs**: Centralized logging for all services
- **Health Checks**: Built-in health monitoring
- **Container Metrics**: App Runner performance metrics
- **DynamoDB Metrics**: Database performance monitoring
- **Error Tracking**: Comprehensive error logging

## 🚀 Deployment

### CI/CD Pipeline

The project includes GitHub Actions workflows for automated deployment:

- **Development**: Auto-deploy on push to `develop` branch
- **Production**: Auto-deploy on push to `main` branch
- **Testing**: Run tests on all pull requests

### Manual Deployment

```bash
# Deploy infrastructure and application
cd infrastructure
./scripts/deploy.sh

# Deploy container changes only
./scripts/build-and-push.sh

# Test deployment
./scripts/test-deployment.sh
```

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- [Infrastructure Guide](infrastructure/README.md) - AWS infrastructure overview
- [ECR Deployment](infrastructure/ECR_DEPLOYMENT.md) - Container deployment guide
- [OIDC Configuration](infrastructure/OIDC_CONFIGURATION.md) - Authentication setup
- [Deployment Guide](infrastructure/DEPLOYMENT_GUIDE.md) - Complete deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting guide](QUICK_START.md#troubleshooting)
2. Review the comprehensive documentation
3. Check AWS CloudWatch logs
4. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting and analytics
- [ ] Integration with external tools (Jira, Slack, etc.)
- [ ] Advanced workload optimization algorithms
- [ ] Multi-tenant support
- [ ] API rate limiting and throttling

---

Built with ❤️ using React, Node.js, and AWS