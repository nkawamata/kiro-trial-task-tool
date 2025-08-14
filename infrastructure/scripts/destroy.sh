#!/bin/bash

# Task Manager Destruction Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${ENVIRONMENT:-dev}

echo -e "${RED}🗑️  Destroying Task Manager Infrastructure${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

# Confirmation
read -p "Are you sure you want to destroy the $ENVIRONMENT environment? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Destruction cancelled.${NC}"
    exit 0
fi

# Additional confirmation for production
if [[ $ENVIRONMENT == "prod" ]]; then
    echo -e "${RED}⚠️  WARNING: You are about to destroy the PRODUCTION environment!${NC}"
    read -p "Type 'DELETE PRODUCTION' to confirm: " -r
    if [[ $REPLY != "DELETE PRODUCTION" ]]; then
        echo -e "${YELLOW}Production destruction cancelled.${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}Destroying stack...${NC}"
cdk destroy TaskManager-$ENVIRONMENT --force

echo -e "${GREEN}🎉 Infrastructure destroyed successfully!${NC}"