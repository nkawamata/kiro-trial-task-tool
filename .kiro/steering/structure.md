# Project Structure

This document defines the organization and folder structure for the multi-project task management tool.

## Current Structure
```
.
├── .kiro/              # Kiro AI assistant configuration
│   └── steering/       # AI guidance documents
└── .vscode/            # VS Code workspace settings
```

## Recommended Full Structure
```
.
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── store/      # State management
│   │   ├── services/   # API calls and AWS integration
│   │   ├── utils/      # Utility functions
│   │   ├── types/      # TypeScript type definitions
│   │   └── assets/     # Images, icons, styles
│   ├── public/
│   └── package.json
├── backend/            # Node.js backend API
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── models/     # Database models
│   │   ├── middleware/ # Express middleware
│   │   ├── services/   # Business logic
│   │   ├── routes/     # API route definitions
│   │   ├── utils/      # Utility functions
│   │   └── config/     # Configuration files
│   ├── tests/
│   └── package.json
├── shared/             # Shared types and utilities
│   ├── types/          # Common TypeScript types
│   └── constants/      # Shared constants
├── infrastructure/     # AWS infrastructure as code
│   ├── cognito/        # Cognito user pool configuration
│   ├── database/       # Database schemas and migrations
│   └── deployment/     # Deployment scripts
├── docs/               # Project documentation
├── .kiro/              # Kiro configuration
├── .vscode/            # VS Code settings
├── README.md
└── package.json        # Root package.json for workspace
```

## Key Modules Organization

### Frontend Structure
- **components/**: Gantt chart, task lists, project switcher, auth components
- **pages/**: Dashboard, project view, task management, user settings
- **store/**: Projects, tasks, users, authentication state
- **services/**: AWS Cognito integration, API client, real-time updates

### Backend Structure
- **controllers/**: projects, tasks, users, workload management
- **models/**: Project, Task, User, Assignment models
- **services/**: Authentication, workload calculation, Gantt data processing

## File Naming Conventions
- **Components**: PascalCase (TaskCard.tsx, GanttChart.tsx)
- **Pages**: PascalCase (ProjectDashboard.tsx, TaskManagement.tsx)
- **Services**: camelCase (authService.ts, projectService.ts)
- **Types**: PascalCase interfaces (Project.ts, Task.ts, User.ts)
- **Utilities**: camelCase (dateUtils.ts, workloadCalculator.ts)

## Feature-Specific Organization
- **Multi-Project**: Separate project context and switching logic
- **Gantt Charts**: Dedicated components for timeline visualization
- **Workload Management**: Services for capacity calculation and distribution
- **Authentication**: AWS Cognito integration in dedicated auth module

## Documentation
- API documentation for all endpoints
- Component documentation with props and usage examples
- AWS Cognito setup and configuration guide
- Database schema documentation