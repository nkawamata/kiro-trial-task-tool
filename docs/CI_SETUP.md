# CI/CD Setup and Coverage

This document explains the GitHub Actions workflows set up for continuous integration, testing, and coverage reporting.

## Workflows

### 1. Test and Coverage (`test-and-coverage.yml`)

**Triggers:**
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`

**What it does:**
- Runs `npm run test:ci` to execute all tests
- Generates coverage reports for frontend and backend
- Uploads coverage artifacts to GitHub
- Uploads coverage to Codecov
- Checks that coverage meets 80% threshold
- Displays coverage summary in GitHub Actions

**Artifacts Generated:**
- `frontend-coverage` - Frontend test coverage reports
- `backend-coverage` - Backend test coverage reports  
- `ci-summary` - Overall CI test results

### 2. Generate Badges (`badges.yml`)

**Triggers:**
- Push to `main` branch
- After "Test and Coverage" workflow completes

**What it does:**
- Generates SVG badges for coverage percentages
- Creates test status badges
- Deploys badges to GitHub Pages

### 3. Full CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**What it does:**
- Runs tests on multiple Node.js versions (18.x, 20.x)
- Performs security audits
- Builds frontend and backend for production
- Comments coverage results on pull requests

## Coverage Badges

Once the workflows run, you can display coverage badges in your README:

```markdown
![Frontend Coverage](https://your-username.github.io/your-repo/badges/frontend-coverage.svg)
![Backend Coverage](https://your-username.github.io/your-repo/badges/backend-coverage.svg)
![Tests](https://your-username.github.io/your-repo/badges/tests.svg)
```

## Coverage Thresholds

The project maintains the following coverage requirements:

### Frontend
- **Statements**: 90%
- **Branches**: 80%
- **Functions**: 88%
- **Lines**: 90%

### Backend
- **Statements**: 95%+
- **Branches**: 80%+
- **Functions**: 100%
- **Lines**: 95%+

## Local Testing

To run the same tests locally that run in CI:

```bash
# Run full CI test suite
npm run test:ci

# Run individual test suites
cd frontend && npm test
cd backend && npm test
```

## Coverage Reports

Coverage reports are generated in the following locations:

```
frontend/coverage/
├── lcov.info          # LCOV format for external tools
├── coverage-final.json # JSON format
├── coverage-summary.json # Summary statistics
└── lcov-report/       # HTML report

backend/coverage/
├── lcov.info          # LCOV format for external tools
├── coverage-final.json # JSON format
├── coverage-summary.json # Summary statistics
└── lcov-report/       # HTML report

coverage/ci/
└── summary.json       # CI test summary
```

## Codecov Integration

Coverage data is automatically uploaded to [Codecov](https://codecov.io) for:
- Detailed coverage analysis
- Coverage diff on pull requests
- Historical coverage tracking
- Integration with GitHub status checks

## Troubleshooting

### Coverage Below Threshold
If coverage drops below the required thresholds:

1. Check which files have low coverage in the CI logs
2. Add more comprehensive tests for uncovered code paths
3. Consider adjusting thresholds if they're unrealistic

### Test Failures
If tests fail in CI but pass locally:

1. Check Node.js version compatibility
2. Ensure all dependencies are properly installed
3. Check for environment-specific issues
4. Review the full CI logs for detailed error messages

### Badge Generation Issues
If badges aren't updating:

1. Check that GitHub Pages is enabled for the repository
2. Verify the badges workflow completed successfully
3. Clear browser cache to see updated badges

## Security

The workflows include security auditing:
- `npm audit` runs on all packages
- High-severity vulnerabilities will fail the build
- Security reports are uploaded as artifacts for review