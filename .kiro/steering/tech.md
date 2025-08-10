# Technology Stack

This document outlines the technical foundation for the multi-project task management tool.

## Build System & Tools
- **Frontend**: Node.js with npm/yarn for package management
- **Backend**: Node.js with npm for dependencies
- **Database**: DynamoDB for scalability and serverless architecture
- **Infrastructure**: AWS services (Cognito, DynamoDB, API Gateway)

## Tech Stack
### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Ant Design
- **Gantt Chart**: @dhtmlx/trial, react-gantt-timeline, or custom D3.js implementation
- **Authentication**: AWS Amplify Auth or aws-sdk for Cognito integration

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: DynamoDB with AWS SDK v3
- **Authentication**: AWS Cognito User Pools with JWT verification
- **API**: RESTful API

### AWS Services
- **Authentication**: AWS Cognito User Pools
- **Database**: DynamoDB (local for development, AWS for production)
- **API Gateway**: AWS API Gateway (for production)
- **Hosting**: AWS Amplify or S3 + CloudFront

### Development Tools
- **IDE**: VS Code with Kiro AI assistant
- **Version Control**: Git
- **Package Management**: npm or yarn
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier

## Common Commands
```bash
# Development
npm run dev          # Start development servers
npm run start:frontend
npm run start:backend

# Testing
npm test            # Run all tests
npm run test:frontend
npm run test:backend

# Building
npm run build       # Build for production
npm run build:frontend
npm run build:backend

# Linting
npm run lint        # Lint all code
npm run lint:fix    # Auto-fix linting issues

# Database
npm run db:create-tables  # Create DynamoDB tables
npm run db:seed          # Seed database with test data
```

## Code Style & Standards
- **TypeScript**: Strict mode enabled, explicit types preferred
- **React**: Functional components with hooks, avoid class components
- **API**: RESTful conventions, consistent error handling
- **Database**: DynamoDB single-table design patterns, proper GSI usage
- **Authentication**: Follow AWS Cognito best practices
- **Testing**: Minimum 80% code coverage, unit and integration tests