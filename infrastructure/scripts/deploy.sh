#!/bin/bash

# Task Manager Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${ENVIRONMENT:-dev}
REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}🚀 Deploying Task Manager Infrastructure${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ CDK CLI not found. Please install: npm install -g aws-cdk${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build TypeScript
echo -e "${YELLOW}Building CDK app...${NC}"
npm run build

# Bootstrap CDK if needed
echo -e "${YELLOW}Checking CDK bootstrap...${NC}"
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    echo -e "${YELLOW}Bootstrapping CDK...${NC}"
    cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$REGION
fi

# Synthesize and validate
echo -e "${YELLOW}Synthesizing CDK app...${NC}"
cdk synth

# Deploy infrastructure first
echo -e "${YELLOW}Deploying CDK stack...${NC}"
cdk deploy TaskManager-$ENVIRONMENT --require-approval never

# Build and push Docker image
echo -e "${YELLOW}Building and pushing Docker image...${NC}"
./scripts/build-and-push.sh

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}Check the AWS Console for stack outputs and resources.${NC}"
echo -e "${YELLOW}App Runner service will automatically deploy the latest image.${NC}"