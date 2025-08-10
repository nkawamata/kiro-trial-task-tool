# Multi-Project Task Manager

A comprehensive task management tool designed for teams working across multiple projects, featuring Gantt chart visualization, workload distribution, and secure AWS Cognito authentication.

## Features

- **Multi-Project Management**: Seamlessly organize and switch between multiple projects
- **Gantt Chart Visualization**: Interactive timeline view for project planning and tracking
- **Workload Distribution**: Balance tasks and resources across multiple projects
- **AWS Cognito Authentication**: Secure user pools for authentication and authorization
- **Real-time Collaboration**: Live updates and team coordination

## Tech Stack

- **Frontend**: React.js with TypeScript, Material-UI/Ant Design
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL or DynamoDB
- **Authentication**: AWS Cognito User Pools
- **Infrastructure**: AWS (API Gateway, Lambda, RDS/DynamoDB)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS account with Cognito configured
- PostgreSQL (if using RDS) or AWS CLI configured for DynamoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables (see `.env.example` files)
4. Configure AWS Cognito User Pool
5. Run database migrations (if using PostgreSQL)

### Development

Start the development servers:
```bash
npm run dev
```

This will start both frontend (React) and backend (Node.js) servers concurrently.

### Building

Build all packages:
```bash
npm run build
```

## Project Structure

- `frontend/` - React.js frontend application
- `backend/` - Node.js API server
- `shared/` - Shared types and utilities
- `infrastructure/` - AWS infrastructure configuration
- `docs/` - Project documentation

## Contributing

1. Follow the established code style and conventions
2. Write tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass before submitting PRs

## License

[Add your license here]