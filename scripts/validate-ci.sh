#!/bin/bash

# Validate CI Configuration Script
set -e

echo "🔍 Validating CI Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if GitHub Actions workflows exist
echo -e "${BLUE}📁 Checking GitHub Actions workflows...${NC}"

if [ -f ".github/workflows/test-and-coverage.yml" ]; then
    echo -e "${GREEN}✅ test-and-coverage.yml found${NC}"
else
    echo -e "${RED}❌ test-and-coverage.yml missing${NC}"
    exit 1
fi

if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✅ ci.yml found${NC}"
else
    echo -e "${YELLOW}⚠️  ci.yml missing (optional)${NC}"
fi

if [ -f ".github/workflows/badges.yml" ]; then
    echo -e "${GREEN}✅ badges.yml found${NC}"
else
    echo -e "${YELLOW}⚠️  badges.yml missing (optional)${NC}"
fi

# Check if test:ci script exists
echo -e "${BLUE}🧪 Checking test scripts...${NC}"

if grep -q "test:ci" package.json; then
    echo -e "${GREEN}✅ test:ci script found in package.json${NC}"
else
    echo -e "${RED}❌ test:ci script missing in package.json${NC}"
    exit 1
fi

# Check if CI test script exists
if [ -f "scripts/test-ci.sh" ]; then
    echo -e "${GREEN}✅ test-ci.sh script found${NC}"
    
    # Check if script is executable
    if [ -x "scripts/test-ci.sh" ]; then
        echo -e "${GREEN}✅ test-ci.sh is executable${NC}"
    else
        echo -e "${YELLOW}⚠️  Making test-ci.sh executable...${NC}"
        chmod +x scripts/test-ci.sh
    fi
else
    echo -e "${RED}❌ test-ci.sh script missing${NC}"
    exit 1
fi

# Check if coverage directories will be created
echo -e "${BLUE}📊 Checking coverage configuration...${NC}"

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    if grep -q "coverage" frontend/package.json; then
        echo -e "${GREEN}✅ Frontend coverage configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend coverage configuration not found${NC}"
    fi
else
    echo -e "${RED}❌ Frontend directory or package.json missing${NC}"
    exit 1
fi

if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    if grep -q "coverage" backend/package.json; then
        echo -e "${GREEN}✅ Backend coverage configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend coverage configuration not found${NC}"
    fi
else
    echo -e "${RED}❌ Backend directory or package.json missing${NC}"
    exit 1
fi

# Test the CI script locally
echo -e "${BLUE}🚀 Testing CI script locally...${NC}"

if npm run test:ci; then
    echo -e "${GREEN}✅ CI tests pass locally${NC}"
else
    echo -e "${RED}❌ CI tests fail locally${NC}"
    echo -e "${YELLOW}⚠️  Fix local tests before pushing to GitHub${NC}"
    exit 1
fi

# Check if coverage files were generated
echo -e "${BLUE}📈 Checking coverage file generation...${NC}"

if [ -f "frontend/coverage/lcov.info" ]; then
    echo -e "${GREEN}✅ Frontend LCOV coverage file generated${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend LCOV coverage file not found${NC}"
fi

if [ -f "backend/coverage/lcov.info" ]; then
    echo -e "${GREEN}✅ Backend LCOV coverage file generated${NC}"
else
    echo -e "${YELLOW}⚠️  Backend LCOV coverage file not found${NC}"
fi

if [ -f "coverage/ci/summary.json" ]; then
    echo -e "${GREEN}✅ CI summary file generated${NC}"
else
    echo -e "${YELLOW}⚠️  CI summary file not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 CI Configuration Validation Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Push your code to GitHub"
echo "2. Check the Actions tab for workflow runs"
echo "3. Enable GitHub Pages for badge hosting (optional)"
echo "4. Update README badges with your repository URL"
echo ""
echo -e "${BLUE}📊 Coverage Summary:${NC}"

if [ -f "frontend/coverage/coverage-summary.json" ]; then
    echo "Frontend Coverage:"
    node -e "
        const coverage = require('./frontend/coverage/coverage-summary.json');
        const total = coverage.total;
        console.log(\`  Statements: \${total.statements.pct}%\`);
        console.log(\`  Branches: \${total.branches.pct}%\`);
        console.log(\`  Functions: \${total.functions.pct}%\`);
        console.log(\`  Lines: \${total.lines.pct}%\`);
    "
fi

if [ -f "backend/coverage/coverage-summary.json" ]; then
    echo "Backend Coverage:"
    node -e "
        const coverage = require('./backend/coverage/coverage-summary.json');
        const total = coverage.total;
        console.log(\`  Statements: \${total.statements.pct}%\`);
        console.log(\`  Branches: \${total.branches.pct}%\`);
        console.log(\`  Functions: \${total.functions.pct}%\`);
        console.log(\`  Lines: \${total.lines.pct}%\`);
    "
fi

echo ""
echo -e "${GREEN}✅ Ready for GitHub Actions CI/CD!${NC}"