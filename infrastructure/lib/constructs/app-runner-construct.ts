import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AppRunnerConstructProps {
  serviceName: string;
  githubRepo: string;
  githubBranch: string;
  instanceRole: iam.Role;
  environment: string;
  environmentVariables?: { [key: string]: string };
}

export class AppRunnerConstruct extends Construct {
  public readonly service: apprunner.CfnService;

  constructor(scope: Construct, id: string, props: AppRunnerConstructProps) {
    super(scope, id);

    // Create App Runner service using L1 construct
    this.service = new apprunner.CfnService(this, 'Service', {
      serviceName: props.serviceName,
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        codeRepository: {
          repositoryUrl: `https://github.com/${props.githubRepo}`,
          sourceCodeVersion: {
            type: 'BRANCH',
            value: props.githubBranch,
          },
          codeConfiguration: {
            configurationSource: 'REPOSITORY',
            codeConfigurationValues: props.environmentVariables ? {
              runtime: 'NODEJS_18',
              buildCommand: 'npm ci && npm run build',
              startCommand: 'npm start',
              port: '3001',
              runtimeEnvironmentVariables: Object.entries(props.environmentVariables).map(([name, value]) => ({
                name,
                value,
              })),
            } : undefined,
          },
        },
      },
      instanceConfiguration: {
        cpu: this.getCpuConfiguration(props.environment),
        memory: this.getMemoryConfiguration(props.environment),
        instanceRoleArn: props.instanceRole.roleArn,
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

    // Add tags
    cdk.Tags.of(this.service).add('Environment', props.environment);
    cdk.Tags.of(this.service).add('Service', 'TaskManager');
    cdk.Tags.of(this.service).add('Component', 'Backend');
  }

  private getCpuConfiguration(environment: string): string {
    switch (environment) {
      case 'prod':
        return '4 vCPU';
      case 'staging':
        return '2 vCPU';
      default:
        return '1 vCPU';
    }
  }

  private getMemoryConfiguration(environment: string): string {
    switch (environment) {
      case 'prod':
        return '8 GB';
      case 'staging':
        return '4 GB';
      default:
        return '2 GB';
    }
  }
}