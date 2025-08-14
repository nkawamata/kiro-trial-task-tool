#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TaskManagerStack } from './task-manager-stack';

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Get configuration from context or environment
const config = {
  environment: app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev',
  domainName: app.node.tryGetContext('domainName') || process.env.DOMAIN_NAME,
  kmsKeyArn: app.node.tryGetContext('kmsKeyArn') || process.env.KMS_KEY_ARN,
  ecrRepositoryName: app.node.tryGetContext('ecrRepositoryName') || process.env.ECR_REPOSITORY_NAME,
  imageTag: app.node.tryGetContext('imageTag') || process.env.IMAGE_TAG || 'latest',
  oidcIssuerUrl: app.node.tryGetContext('oidcIssuerUrl') || process.env.OIDC_ISSUER_URL,
  oidcClientId: app.node.tryGetContext('oidcClientId') || process.env.OIDC_CLIENT_ID,
  oidcClientSecret: app.node.tryGetContext('oidcClientSecret') || process.env.OIDC_CLIENT_SECRET,
};

new TaskManagerStack(app, `TaskManager-${config.environment}`, {
  env,
  config,
  description: `Task Manager Application Stack - ${config.environment}`,
});

app.synth();