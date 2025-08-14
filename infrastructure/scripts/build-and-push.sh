#!/bin/bash

# Build and Push Docker Image to ECR
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${ENVIRONMENT:-dev}
REGION=${AWS_REGION:-us-east-1}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo -e "${GREEN}🐳 Building and pushing Docker image to ECR${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo -e "${YELLOW}Image Tag: $IMAGE_TAG${NC}"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Failed to get AWS account ID. Please check AWS credentials.${NC}"
    exit 1
fi

# Set ECR repository name
ECR_REPOSITORY_NAME=${ECR_REPOSITORY_NAME:-"task-manager-backend-${ENVIRONMENT}"}
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPOSITORY_NAME}"

echo -e "${YELLOW}ECR Repository: $ECR_URI${NC}"

# Check if repository exists, create if it doesn't
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}Creating ECR repository: $ECR_REPOSITORY_NAME${NC}"
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=KMS
fi

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
cd ../backend
docker build -t $ECR_REPOSITORY_NAME:$IMAGE_TAG .

# Tag image for ECR
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $ECR_URI:latest

# Push image to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push $ECR_URI:$IMAGE_TAG
docker push $ECR_URI:latest

echo -e "${GREEN}✅ Successfully pushed image to ECR!${NC}"
echo -e "${YELLOW}Image URI: $ECR_URI:$IMAGE_TAG${NC}"

# Update App Runner service if it exists
SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='task-manager-${ENVIRONMENT}'].ServiceArn" --output text --region $REGION)

if [ ! -z "$SERVICE_ARN" ]; then
    echo -e "${YELLOW}Updating App Runner service...${NC}"
    aws apprunner start-deployment --service-arn $SERVICE_ARN --region $REGION
    echo -e "${GREEN}✅ App Runner deployment started!${NC}"
else
    echo -e "${YELLOW}⚠️  App Runner service not found. Deploy the CDK stack first.${NC}"
fi

echo -e "${GREEN}🎉 Build and push completed successfully!${NC}"