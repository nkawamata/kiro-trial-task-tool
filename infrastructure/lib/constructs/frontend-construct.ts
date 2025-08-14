import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface FrontendConstructProps {
  environment: string;
  kmsKey: kms.IKey;
  backendUrl: string;
  domainName?: string;
}

export class FrontendConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendConstructProps) {
    super(scope, id);

    const { environment, kmsKey, backendUrl } = props;
    const removalPolicy = environment === 'prod' 
      ? cdk.RemovalPolicy.RETAIN 
      : cdk.RemovalPolicy.DESTROY;

    // S3 Bucket for Frontend
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `task-manager-frontend-${environment}-${cdk.Stack.of(this).account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      removalPolicy,
      autoDeleteObjects: environment !== 'prod',
      versioned: environment === 'prod',
    });

    // Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for Task Manager ${environment}`,
    });

    // Grant CloudFront access to S3 bucket
    this.bucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `Task Manager Frontend - ${environment}`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(this.bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: this.getCachePolicy(environment),
        compress: true,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(backendUrl.replace('https://', '')),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: this.getPriceClass(environment),
      enableLogging: environment === 'prod',
    });

    // Add tags
    cdk.Tags.of(this.bucket).add('Environment', environment);
    cdk.Tags.of(this.bucket).add('Service', 'TaskManager');
    cdk.Tags.of(this.bucket).add('Component', 'Frontend');

    cdk.Tags.of(this.distribution).add('Environment', environment);
    cdk.Tags.of(this.distribution).add('Service', 'TaskManager');
    cdk.Tags.of(this.distribution).add('Component', 'CDN');
  }

  private getCachePolicy(environment: string): cloudfront.ICachePolicy {
    if (environment === 'prod') {
      return cloudfront.CachePolicy.CACHING_OPTIMIZED;
    }
    return cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS;
  }

  private getPriceClass(environment: string): cloudfront.PriceClass {
    switch (environment) {
      case 'prod':
        return cloudfront.PriceClass.PRICE_CLASS_ALL;
      case 'staging':
        return cloudfront.PriceClass.PRICE_CLASS_100;
      default:
        return cloudfront.PriceClass.PRICE_CLASS_100;
    }
  }
}