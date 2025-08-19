#!/bin/bash

# Comprehensive Test Runner
# Runs different types of tests based on arguments

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --type)
      TEST_TYPE="$2"
      shift 2
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --type TYPE     Test type: all, frontend, backend, unit, integration"
      echo "  --coverage      Generate coverage report"
      echo "  --watch         Run tests in watch mode"
      echo "  --verbose       Verbose output"
      echo "  -h, --help      Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🧪 Running tests...${NC}"
echo -e "Type: ${YELLOW}$TEST_TYPE${NC}"
echo -e "Coverage: ${YELLOW}$COVERAGE${NC}"
echo -e "Watch: ${YELLOW}$WATCH${NC}"

# Build test command arguments
FRONTEND_ARGS=""
BACKEND_ARGS=""

if [ "$COVERAGE" = true ]; then
  FRONTEND_ARGS="$FRONTEND_ARGS --coverage"
  BACKEND_ARGS="$BACKEND_ARGS --coverage"
fi

if [ "$WATCH" = true ]; then
  FRONTEND_ARGS="$FRONTEND_ARGS --watch"
  BACKEND_ARGS="$BACKEND_ARGS --watch"
else
  FRONTEND_ARGS="$FRONTEND_ARGS --watchAll=false"
fi

if [ "$VERBOSE" = true ]; then
  FRONTEND_ARGS="$FRONTEND_ARGS --verbose"
  BACKEND_ARGS="$BACKEND_ARGS --verbose"
fi

# Run tests based on type
case $TEST_TYPE in
  "all")
    echo -e "${BLUE}📱 Running Frontend Tests...${NC}"
    if [ -d "frontend" ]; then
      cd frontend && npm test -- $FRONTEND_ARGS && cd ..
    fi
    echo -e "${BLUE}🖥️  Running Backend Tests...${NC}"
    if [ -d "backend" ]; then
      cd backend && npm test -- $BACKEND_ARGS && cd ..
    fi
    ;;
  "frontend")
    echo -e "${BLUE}📱 Running Frontend Tests...${NC}"
    if [ -d "frontend" ]; then
      cd frontend && npm test -- $FRONTEND_ARGS && cd ..
    fi
    ;;
  "backend")
    echo -e "${BLUE}🖥️  Running Backend Tests...${NC}"
    if [ -d "backend" ]; then
      cd backend && npm test -- $BACKEND_ARGS && cd ..
    fi
    ;;
  "unit")
    echo -e "${BLUE}🔬 Running Unit Tests...${NC}"
    if [ -d "frontend" ]; then
      cd frontend && npm test -- $FRONTEND_ARGS --testPathPattern=".*\.test\.(ts|tsx)$" && cd ..
    fi
    if [ -d "backend" ]; then
      cd backend && npm test -- $BACKEND_ARGS --testPathPattern=".*\.test\.ts$" && cd ..
    fi
    ;;
  "integration")
    echo -e "${BLUE}🔗 Running Integration Tests...${NC}"
    if [ -d "frontend" ]; then
      cd frontend && npm test -- $FRONTEND_ARGS --testPathPattern=".*\.integration\.test\.(ts|tsx)$" && cd ..
    fi
    if [ -d "backend" ]; then
      cd backend && npm test -- $BACKEND_ARGS --testPathPattern=".*\.integration\.test\.ts$" && cd ..
    fi
    ;;
  *)
    echo -e "${RED}❌ Unknown test type: $TEST_TYPE${NC}"
    exit 1
    ;;
esac

if [ "$COVERAGE" = true ] && [ "$WATCH" = false ]; then
  echo -e "${GREEN}✅ Tests completed successfully!${NC}"
  echo -e "${BLUE}📊 Coverage reports generated:${NC}"
  echo -e "  Frontend: frontend/coverage/lcov-report/index.html"
  echo -e "  Backend: backend/coverage/lcov-report/index.html"
  
  # Open coverage report on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🌐 Opening coverage reports...${NC}"
    open frontend/coverage/lcov-report/index.html
    open backend/coverage/lcov-report/index.html
  fi
fi

echo -e "${GREEN}🎉 All tests completed!${NC}"