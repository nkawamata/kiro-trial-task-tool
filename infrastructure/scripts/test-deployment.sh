#!/bin/bash

# Test Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Testing Task Manager Infrastructure Deployment${NC}"

# Check if required environment variables are set
if [ -z "$OIDC_ISSUER_URL" ] || [ -z "$OIDC_CLIENT_ID" ] || [ -z "$OIDC_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Missing required OIDC environment variables${NC}"
    echo -e "${YELLOW}Please set:${NC}"
    echo -e "  export OIDC_ISSUER_URL=\"https://your-provider.com\""
    echo -e "  export OIDC_CLIENT_ID=\"your-client-id\""
    echo -e "  export OIDC_CLIENT_SECRET=\"your-client-secret\""
    exit 1
fi

# Set test environment
export ENVIRONMENT=test
export IMAGE_TAG=test-$(date +%s)

echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Image Tag: $IMAGE_TAG${NC}"
echo -e "${YELLOW}OIDC Provider: $OIDC_ISSUER_URL${NC}"

# Validate CDK syntax
echo -e "${YELLOW}Validating CDK syntax...${NC}"
npm run build
cdk synth --quiet

# Deploy test stack
echo -e "${YELLOW}Deploying test infrastructure...${NC}"
cdk deploy TaskManager-$ENVIRONMENT --require-approval never

# Build and push test image
echo -e "${YELLOW}Building and pushing test image...${NC}"
./scripts/build-and-push.sh

# Wait for deployment to complete
echo -e "${YELLOW}Waiting for App Runner deployment...${NC}"
sleep 30

# Get service URL
SERVICE_URL=$(aws cloudformation describe-stacks \
    --stack-name TaskManager-$ENVIRONMENT \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text)

if [ ! -z "$SERVICE_URL" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${YELLOW}Service URL: $SERVICE_URL${NC}"
    
    # Test health endpoint
    echo -e "${YELLOW}Testing health endpoint...${NC}"
    if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
    fi
else
    echo -e "${RED}❌ Failed to get service URL${NC}"
fi

echo -e "${GREEN}🎉 Test deployment completed!${NC}"
echo -e "${YELLOW}Remember to clean up test resources:${NC}"
echo -e "  cdk destroy TaskManager-$ENVIRONMENT"