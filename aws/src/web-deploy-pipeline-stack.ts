import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import * as cb from '@aws-cdk/aws-codebuild';
import * as cp from '@aws-cdk/aws-codepipeline';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as kms from '@aws-cdk/aws-kms';
import * as lam from '@aws-cdk/aws-lambda';
import * as tag from '@clublabs/aws-cdk-tagging';
import { DeployPipelineArtifactsProps, Regions, ZapScanProps } from './types';
import { Helper } from './helper';
import { addPipelineNotification } from './pipeline-notification';
import { constants } from './constants';
import { addZapScans } from './zap-scans';

interface WebDeployPipelineStackProps extends cdk.StackProps {
  /**
   * Registered workload project name. This is used in admin pre-reqs pipeline and
   * defines the workload roles using this prefix.
   */
  projectName: string;

  /**
   * @default - ${projectName}-web
   * @example - payments-web
   */
  webName?: string;
  target: {
    accountId: string;
    environment: string;
    /**
     * Deployment path
     * @default - root of the bucket
     * @example - "foldername"
     */
    path?: string;
    bucketName?: {
      /**
       * @default ${projectName}-${environment}-${region}
       * eg. project-web-dev-us-west-2
       */
      [key in Regions]: string;
    }
  },
  builtArtifactsBucket?: {
    /**
     * @default - us-west-2
     */
    region: Regions;
  },
  pipelineArtifactsBuckets: DeployPipelineArtifactsProps,
  /**
   * Cloudfront info for invalidating cache
   */
  cloudfront: {
    accountId: string;
    path: string;
  },
  /**
   * Enable Zap Scan.
   */
  zapScan?: ZapScanProps,
  build?: {
    /**
     * @default - packaged_build_artifact.zip
     */
    artifactName?: string;
  },
  /**
 * ACE Tags for this Pipeline.
 * This will tag all resources in the stack
 */
  tags: {
    [tag.TaggingKey.Region]: Regions,
    [tag.TaggingKey.Environment]: tag.EnvironmentValue,
    [tag.TaggingKey.Workload]: tag.WorkloadValue,
    [tag.TaggingKey.Team]: tag.TeamValue,
    [tag.TaggingKey.DataProfile]: tag.DataProfileValue,
    [tag.TaggingKey.Department]: tag.DepartmentValue
  },
  /**
  * Tags defined by the Team
  */
  teamTags?: Array<{ key: string; value: string }>;
  /**
   * Enable Chatbot Pipeline Notifications
   */
  notifications?: {
    chatbotChannelName: string;
  }
}

export class WebDeployPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: WebDeployPipelineStackProps) {
    super(scope, id, props);

    const currentAccount = cdk.Stack.of(this).account;
    const projectName = props.projectName;
    const webName = props.webName ? `${props.projectName}-${props.webName}` : (projectName.endsWith('web') ? projectName : `${projectName}-web`);
    const environment = props.target.environment;

    //Features
    const zapEnabled = props.zapScan?.enabled || false;
    const zapScanBucketPrefix = props.zapScan?.bucketPrefix || projectName;

    //Built artifacts
    const artifactName = props.build?.artifactName || 'packaged_build_artifact.zip';

    //Target Account
    const targetAccountID = props.target.accountId;
    const targetAccountCrossAccountRole = iam.Role.fromRoleArn(this, 'TargetAccountCrossAccountRole', Helper.getCodePipelineCrossAccountRoleArn(targetAccountID, projectName), { mutable: false });

    //CloudFront
    const cloudfrontPath = props.cloudfront.path;
    const cloudfrontAccountID = props.cloudfront.accountId;

    //Stored artifacts
    const artifactsStoreKMSKeyOregonId = props.pipelineArtifactsBuckets.kmsKeyIds['us-west-2'];
    const artifactsStoreKMSKeyVirginiaId = props.pipelineArtifactsBuckets.kmsKeyIds['us-east-1'];

    //Website bucket
    const websiteBucketNameOregon = props.target.bucketName?.[Regions.USWest2] || `${webName}-${environment}-${Regions.USWest2}`;
    const websiteBucketNameVirginia = props.target.bucketName?.[Regions.USEast1] || `${webName}-${environment}-${Regions.USEast1}`;

    //Objects
    const codePipelineExecutionRole = iam.Role.fromRoleArn(this, 'CodePipelineExecutionRole', Helper.getCodePipelineExecutionRoleArn(currentAccount, projectName), { mutable: false });

    const builtArtifactsRegion = props.builtArtifactsBucket?.region || Regions.USWest2;
    const builtArtifactsBucket = s3.Bucket.fromBucketName(this, 'ArtifactsBucket', Helper.getBuiltArtifactsBucketName(projectName, builtArtifactsRegion));

    const storedArtifactKMSKeyOregon = kms.Key.fromKeyArn(this, `StoredArtifactKMSKeyOregon`, `arn:aws:kms:${Regions.USWest2}:${currentAccount}:key/${artifactsStoreKMSKeyOregonId}`);
    const storedArtifactsBucketOregon = s3.Bucket.fromBucketName(this, 'StoredArtifactsBucketOregon', Helper.getPipelineArtifactsBucketName(projectName, Regions.USWest2, props.pipelineArtifactsBuckets.bucketName, props.pipelineArtifactsBuckets.suffix));
    (storedArtifactsBucketOregon as any).encryptionKey = storedArtifactKMSKeyOregon //Need to do it this way for KMS key

    const storedArtifactKMSKeyVirginia = kms.Key.fromKeyArn(this, `StoredArtifactKMSKeyVirginia`, `arn:aws:kms:${Regions.USEast1}:${currentAccount}:key/${artifactsStoreKMSKeyVirginiaId}`);
    const storedArtifactsBucketVirginia = s3.Bucket.fromBucketName(this, 'StoredArtifactsBucketVirginia', Helper.getPipelineArtifactsBucketName(projectName, Regions.USEast1, props.pipelineArtifactsBuckets.bucketName, props.pipelineArtifactsBuckets.suffix));
    (storedArtifactsBucketVirginia as any).encryptionKey = storedArtifactKMSKeyVirginia //Need to do it this way for KMS key

    const sourceOutput = new cp.Artifact('SourceOutput');
    const zapScanOutput = new cp.Artifact('ZapScanOutput');

    //////////////
    // Pipeline //
    //////////////

    const pipeline = new cp.Pipeline(this, 'DeployPipeline', {
      pipelineName: `${webName}-${environment}-deploy-pipeline`,
      role: codePipelineExecutionRole,
      crossRegionReplicationBuckets: {
        'us-west-2': storedArtifactsBucketOregon,
        'us-east-1': storedArtifactsBucketVirginia
      }
    });

    ////////////
    // Source //
    ////////////

    const sourceActions: cp.IAction[] = [
      new cpa.S3SourceAction({
        actionName: 'SourceS3',
        bucket: builtArtifactsBucket,
        bucketKey: `web/builds/deploy/${environment}/${artifactName}`,
        trigger: cpa.S3Trigger.POLL,
        output: sourceOutput,
        role: codePipelineExecutionRole,
        runOrder: 1
      })
    ];
    if (zapEnabled) {
      sourceActions.push(
        new cpa.GitHubSourceAction({
          actionName: 'CheckoutForZapScans',
          owner: 'clublabs',
          repo: 'aws-zap-scans',
          oauthToken: cdk.SecretValue.secretsManager(constants.GITHUB_OAUTH_TOKEN_SECRET_NAME),
          output: zapScanOutput,
          trigger: cpa.GitHubTrigger.NONE,
          branch: 'main'
        })
      )
    }

    pipeline.addStage({
      stageName: 'Source',
      actions: sourceActions
    });

    //////////////////////
    // Deploy us-west-2 //
    //////////////////////

    const websiteBucketOregon = s3.Bucket.fromBucketAttributes(this, 'BucketForWebsiteOregon', {
      bucketArn: `arn:aws:s3:${Regions.USWest2}:${targetAccountID}:${websiteBucketNameOregon}`,
      region: Regions.USWest2
    });

    pipeline.addStage({
      stageName: 'DeployOregon',
      actions: [
        new cpa.S3DeployAction({
          actionName: 'Website',
          input: sourceOutput,
          bucket: websiteBucketOregon,
          role: targetAccountCrossAccountRole,
          accessControl: s3.BucketAccessControl.PRIVATE,
          objectKey: props.target.path
        }),
      ],
    });

    //////////////////////
    // Deploy us-east-1 //
    //////////////////////

    const websiteBucketVirginia = s3.Bucket.fromBucketAttributes(this, 'BucketForWebsiteVirginia', {
      bucketArn: `arn:aws:s3:${Regions.USEast1}:${targetAccountID}:${websiteBucketNameVirginia}`,
      region: Regions.USEast1
    });

    pipeline.addStage({
      stageName: 'DeployVirginia',
      actions: [
        new cpa.S3DeployAction({
          actionName: 'Website',
          input: sourceOutput,
          bucket: websiteBucketVirginia,
          role: targetAccountCrossAccountRole,
          accessControl: s3.BucketAccessControl.PRIVATE,
          objectKey: props.target.path
        }),
      ],
    });

    //////////////////////
    // Invalidate Cache //
    //////////////////////
    const cacheInvalidationCrossAccountRoleName = 'cache-invalidation-cross-account-role';
    const cacheInvalidationCrossAccountRole = iam.Role.fromRoleArn(this, 'CachInvalidationCrossAccountRole', `arn:aws:iam::${cloudfrontAccountID}:role/${cacheInvalidationCrossAccountRoleName}`, { mutable: false });

    const cfCacheInvalidationLambda = lam.Function.fromFunctionArn(this, 'CFCacheInvalidationLambda', `arn:aws:lambda:us-west-2:${cloudfrontAccountID}:function:cf-cache-invalidation`);
    pipeline.addStage({
      stageName: 'InvalidateCFCache',
      actions: [
        new cpa.LambdaInvokeAction({
          actionName: 'InvalidateCFCacheAction',
          lambda: cfCacheInvalidationLambda,
          userParameters: {
            paths: [
              `/${cloudfrontPath}*`
            ],
          },
          role: cacheInvalidationCrossAccountRole
        })
      ],
    });

    if (zapEnabled) {
      addZapScans(this, {
        pipeline,
        codePipelineExecutionRole,
        zapScanInput: zapScanOutput,
        environment,
        projectName: zapScanBucketPrefix,
        endpointUrl: props.zapScan?.endpointUrl
      })
    }

    if (props.notifications) {
      const notificationRuleName = `${webName}-${environment}-deploy-notification`;
      addPipelineNotification(this, currentAccount, notificationRuleName, pipeline.pipelineArn, props.notifications.chatbotChannelName);
    }

    tag.addTeamTags(this, props.tags['ace:team'], props.teamTags);

  }
}