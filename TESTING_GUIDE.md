# Testing Guide

This document provides comprehensive information about testing in the Task Manager application.

## 🧪 Test Structure

### Frontend Tests
```
frontend/src/
├── components/
│   ├── teams/__tests__/
│   │   └── TeamsPage.test.tsx
│   └── workload/__tests__/
│       └── WorkloadTeamView.test.tsx
├── services/__tests__/
│   └── teamsService.test.ts
├── store/slices/__tests__/
│   └── teamsSlice.test.ts
├── hooks/__tests__/
│   └── useApiAuth.test.ts
└── utils/__tests__/
    └── dateUtils.test.ts
```

### Backend Tests
```
backend/src/__tests__/
├── services/
│   ├── teamsService.test.ts
│   ├── workloadService.test.ts
│   └── projectService.test.ts
├── routes/
│   └── teams.test.ts
├── middleware/
│   └── auth.test.ts
└── setup.ts
```

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test type
./scripts/run-tests.sh --type frontend
./scripts/run-tests.sh --type backend
./scripts/run-tests.sh --type unit
./scripts/run-tests.sh --type integration

# Generate comprehensive coverage report
./scripts/test-coverage.sh
```

### Detailed Test Commands

#### Frontend Tests
```bash
cd frontend

# Run all frontend tests
npm test

# Run with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- TeamsPage.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should create team"

# Run in watch mode
npm test -- --watch
```

#### Backend Tests
```bash
cd backend

# Run all backend tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- teamsService.test.ts

# Run in watch mode
npm test -- --watch
```

## 📊 Coverage Reports

### Coverage Thresholds
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Viewing Coverage Reports
After running tests with coverage, reports are available at:
- Frontend: `frontend/coverage/lcov-report/index.html`
- Backend: `backend/coverage/lcov-report/index.html`
- Combined: `coverage/combined/summary.html`

## 🧩 Test Types

### Unit Tests
Test individual components, functions, and services in isolation.

**Examples:**
- Component rendering
- Service method functionality
- Utility function behavior
- Redux slice actions

### Integration Tests
Test interactions between multiple components or services.

**Examples:**
- API route handlers with services
- Component interactions with Redux store
- Service integrations with external APIs

### Component Tests
Test React components with user interactions.

**Examples:**
- User clicking buttons
- Form submissions
- State changes
- Props handling

## 🛠️ Testing Tools

### Frontend
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers

### Backend
- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library
- **aws-sdk-client-mock**: AWS SDK mocking
- **ts-jest**: TypeScript support for Jest

## 📝 Writing Tests

### Frontend Component Test Example
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <Provider store={mockStore}>
        <MyComponent />
      </Provider>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(
      <Provider store={mockStore}>
        <MyComponent />
      </Provider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Backend Service Test Example
```typescript
import { MyService } from '../services/MyService';
import { mockClient } from 'aws-sdk-client-mock';

const mockDynamoClient = mockClient(DynamoDBDocumentClient);

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    mockDynamoClient.reset();
    service = new MyService();
  });

  it('should perform operation successfully', async () => {
    mockDynamoClient.on(PutCommand).resolves({});
    
    const result = await service.createItem(mockData);
    
    expect(result).toHaveProperty('id');
    expect(mockDynamoClient).toHaveReceivedCommand(PutCommand);
  });
});
```

## 🎯 Best Practices

### General
- Write descriptive test names
- Test both success and error cases
- Use proper setup and teardown
- Mock external dependencies
- Aim for high coverage but focus on quality

### Frontend
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Mock external services and APIs
- Test accessibility features

### Backend
- Test all API endpoints
- Validate request/response formats
- Test authentication and authorization
- Mock database operations

## 🔧 Configuration Files

### Jest Configuration
- Frontend: `frontend/jest.config.js`
- Backend: `backend/jest.config.js`

### Test Setup
- Frontend: `frontend/src/setupTests.ts`
- Backend: `backend/src/__tests__/setup.ts`

### Coverage Configuration
- Thresholds defined in jest.config.js
- Exclusions for non-testable files
- Multiple report formats (text, lcov, html, json)

## 🚨 Troubleshooting

### Common Issues

#### Frontend
- **Module not found**: Check import paths and mock configurations
- **Component not rendering**: Ensure proper providers (Redux, Router)
- **Async operations**: Use waitFor() for async state changes

#### Backend
- **Database connection**: Ensure proper mocking of AWS SDK
- **Authentication**: Mock auth middleware in tests
- **Environment variables**: Set test environment variables

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file with debugging
npm test -- --testNamePattern="specific test" --verbose

# Check test coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/specific/path/**/*.ts"
```

## 📈 Continuous Integration

Tests are automatically run in CI/CD pipeline:
- All tests must pass before merge
- Coverage thresholds must be met
- No console errors or warnings allowed

## 🎉 Test Metrics

Current test statistics:
- **Total Test Files**: 15+
- **Frontend Tests**: 8+
- **Backend Tests**: 7+
- **Coverage**: 75%+ overall
- **Test Execution Time**: < 30 seconds

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [AWS SDK Client Mock](https://github.com/m-radzikowski/aws-sdk-client-mock)