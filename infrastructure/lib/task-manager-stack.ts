import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface TaskManagerStackProps extends cdk.StackProps {
  config: {
    environment: string;
    domainName?: string;
    kmsKeyArn?: string;
    ecrRepositoryName?: string;
    imageTag?: string;
    oidcIssuerUrl?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
  };
}

export class TaskManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TaskManagerStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Import external KMS key if provided, otherwise create one
    const kmsKey = config.kmsKeyArn
      ? kms.Key.fromKeyArn(this, 'ExternalKmsKey', config.kmsKeyArn)
      : new kms.Key(this, 'TaskManagerKey', {
        description: 'KMS Key for Task Manager Application',
        enableKeyRotation: true,
        alias: `task-manager-${config.environment}`,
      });

    // DynamoDB Tables
    const projectsTable = new dynamodb.Table(this, 'ProjectsTable', {
      tableName: `task-manager-projects-${config.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: `task-manager-tasks-${config.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for project-based queries
    tasksTable.addGlobalSecondaryIndex({
      indexName: 'ProjectIndex',
      partitionKey: { name: 'projectId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for assignee-based queries
    tasksTable.addGlobalSecondaryIndex({
      indexName: 'AssigneeIndex',
      partitionKey: { name: 'assigneeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'dueDate', type: dynamodb.AttributeType.STRING },
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `task-manager-users-${config.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for email-based queries
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    // ECR Repository for Backend Container
    const ecrRepository = config.ecrRepositoryName
      ? ecr.Repository.fromRepositoryName(this, 'BackendRepository', config.ecrRepositoryName)
      : new ecr.Repository(this, 'BackendRepository', {
          repositoryName: `task-manager-backend-${config.environment}`,
          imageScanOnPush: true,
          encryption: ecr.RepositoryEncryption.KMS,
          encryptionKey: kmsKey,
          removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

    // OpenID Connect Configuration (Generic)
    // Authentication will be handled via environment variables:
    // - OIDC_ISSUER_URL: The OpenID Connect provider URL
    // - OIDC_CLIENT_ID: OAuth2 client ID
    // - OIDC_CLIENT_SECRET: OAuth2 client secret
    // - OIDC_REDIRECT_URI: Callback URL after authentication

    // IAM Role for App Runner Access (ECR access)
    const appRunnerAccessRole = new iam.Role(this, 'AppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      description: 'IAM role for App Runner to access ECR',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // IAM Role for App Runner Instance
    const appRunnerRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'IAM role for Task Manager App Runner service',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // Grant DynamoDB permissions
    projectsTable.grantReadWriteData(appRunnerRole);
    tasksTable.grantReadWriteData(appRunnerRole);
    usersTable.grantReadWriteData(appRunnerRole);

    // Grant KMS permissions
    kmsKey.grantEncryptDecrypt(appRunnerRole);

    // Grant ECR permissions to access role
    ecrRepository.grantPull(appRunnerAccessRole);

    // No additional IAM permissions needed for generic OIDC
    // Authentication will be handled by the application using OIDC client credentials

    // App Runner Service using ECR Image
    const imageTag = config.imageTag || 'latest';
    const imageUri = `${ecrRepository.repositoryUri}:${imageTag}`;

    const appRunnerService = new apprunner.CfnService(this, 'TaskManagerAppRunner', {
      serviceName: `task-manager-${config.environment}`,
      sourceConfiguration: {
        autoDeploymentsEnabled: false, // Manual deployments with ECR
        imageRepository: {
          imageIdentifier: imageUri,
          imageConfiguration: {
            port: '3001',
            runtimeEnvironmentVariables: [
              {
                name: 'NODE_ENV',
                value: 'production',
              },
              {
                name: 'PORT',
                value: '3001',
              },
              {
                name: 'AWS_REGION',
                value: cdk.Stack.of(this).region,
              },
              {
                name: 'DYNAMODB_PROJECTS_TABLE',
                value: projectsTable.tableName,
              },
              {
                name: 'DYNAMODB_TASKS_TABLE',
                value: tasksTable.tableName,
              },
              {
                name: 'DYNAMODB_USERS_TABLE',
                value: usersTable.tableName,
              },
              {
                name: 'KMS_KEY_ID',
                value: kmsKey.keyId,
              },
              // OpenID Connect configuration (to be set externally)
              {
                name: 'OIDC_ISSUER_URL',
                value: config.oidcIssuerUrl || 'https://your-oidc-provider.com',
              },
              {
                name: 'OIDC_CLIENT_ID',
                value: config.oidcClientId || 'your-client-id',
              },
              {
                name: 'OIDC_CLIENT_SECRET',
                value: config.oidcClientSecret || 'your-client-secret',
              },
              {
                name: 'OIDC_REDIRECT_URI',
                value: config.domainName
                  ? `https://${config.domainName}/auth/callback`
                  : 'http://localhost:3000/auth/callback',
              },
            ],
          },
          imageRepositoryType: 'ECR',
        },
      },
      instanceConfiguration: {
        cpu: '2 vCPU',
        memory: '4 GB',
        instanceRoleArn: appRunnerRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // Add dependency on access role
    appRunnerService.addPropertyOverride('SourceConfiguration.ImageRepository.ImageConfiguration.AccessRoleArn', appRunnerAccessRole.roleArn);

    // S3 Bucket for Frontend
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `task-manager-frontend-${config.environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.environment !== 'prod',
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(appRunnerService.attrServiceUrl.replace('https://', '')),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'OidcIssuerUrl', {
      value: config.oidcIssuerUrl || 'https://your-oidc-provider.com',
      description: 'OpenID Connect Issuer URL',
      exportName: `TaskManager-${config.environment}-OidcIssuerUrl`,
    });

    new cdk.CfnOutput(this, 'OidcClientId', {
      value: config.oidcClientId || 'your-client-id',
      description: 'OpenID Connect Client ID',
      exportName: `TaskManager-${config.environment}-OidcClientId`,
    });

    new cdk.CfnOutput(this, 'AppRunnerServiceUrl', {
      value: appRunnerService.attrServiceUrl,
      description: 'App Runner Service URL',
      exportName: `TaskManager-${config.environment}-AppRunnerUrl`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `TaskManager-${config.environment}-CloudFrontUrl`,
    });

    new cdk.CfnOutput(this, 'ProjectsTableName', {
      value: projectsTable.tableName,
      description: 'DynamoDB Projects Table Name',
      exportName: `TaskManager-${config.environment}-ProjectsTable`,
    });

    new cdk.CfnOutput(this, 'TasksTableName', {
      value: tasksTable.tableName,
      description: 'DynamoDB Tasks Table Name',
      exportName: `TaskManager-${config.environment}-TasksTable`,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users Table Name',
      exportName: `TaskManager-${config.environment}-UsersTable`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `TaskManager-${config.environment}-KmsKeyId`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
      exportName: `TaskManager-${config.environment}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR Repository URI for Backend',
      exportName: `TaskManager-${config.environment}-EcrRepositoryUri`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: ecrRepository.repositoryName,
      description: 'ECR Repository Name',
      exportName: `TaskManager-${config.environment}-EcrRepositoryName`,
    });
  }
}