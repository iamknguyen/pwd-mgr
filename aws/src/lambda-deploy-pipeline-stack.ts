import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cp from '@aws-cdk/aws-codepipeline';
import * as cb from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as kms from '@aws-cdk/aws-kms';
import * as tag from '@clublabs/aws-cdk-tagging';
import { DeployIntegrationTestsProps, DeployPipelineArtifactsProps, DeployTargetParameterOverridesProps, DeployTargetProps, ZapScanProps } from './types';
import { Regions } from "./types/Regions";
import { Helper } from './helper';
import { addPipelineNotification } from './pipeline-notification';
import { constants } from './constants';
import { CodeBuildActionProps } from '@aws-cdk/aws-codepipeline-actions';
import { addZapScans } from './zap-scans';

interface LambdaDeployPipelineStackProps extends cdk.StackProps {
  /**
   * Workload name created with the admin pre-requisites pipeline
   */
  projectName: string;

  /**
   * Allows you to customize the pipeline prefix name to use a name other than projectName.
   * @default: projectName
   */
  pipelinePrefix?: string;
  lambdaName: string;
  builtArtifactsBucket?: {
    /**
     * @default - us-west-2
     */
    region: Regions;
  },
  pipelineArtifactsBuckets: DeployPipelineArtifactsProps,
  target: DeployTargetProps;
  parameterOverrides?: DeployTargetParameterOverridesProps;
  /**
   * Integration tests
   */
  integrationTests?: DeployIntegrationTestsProps;
  /**
   * End to End tests. (aka: ui testing)
   */
  endToEndTests?: DeployIntegrationTestsProps;
  /**
   * Enable Zap Scan.
   */
  zapScan?: ZapScanProps;
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

export class LambdaDeployPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: LambdaDeployPipelineStackProps) {
    super(scope, id, props);

    const currentAccount = cdk.Stack.of(this).account;

    if (props.target.environment == tag.EnvironmentValue.Prod && !props.pipelineArtifactsBuckets.suffix) {
      throw new Error('Deploying to Prod requires a suffix')
    }

    const projectName = props.projectName;
    const environment = props.target.environment;
    const targetAccountID = props.target.accountId;
    const regions = props.target.regions ?? [Regions.USWest2, Regions.USEast1];
    const pipelinePrefix = props.pipelinePrefix || projectName;

    const integrationTestsEnabled = props.integrationTests?.enabled || false;
    const endToEndTestsEnabled = props.endToEndTests?.enabled || false;
    const zapEnabled = props.zapScan?.enabled || false;
    const zapScanBucketPrefix = props.zapScan?.bucketPrefix || projectName;

    //Lambda
    const lambdaName = props.lambdaName;
    const lambdaNameWithDashes = lambdaName.replace(/_/g, '-');

    //Objects
    const codePipelineExecutionRole = iam.Role.fromRoleArn(this, 'CodePipelineExecutionRole', Helper.getCodePipelineExecutionRoleArn(currentAccount, projectName), { mutable: false });
    const targetAccountCloudFormationRole = iam.Role.fromRoleArn(this, 'TargetAccountCloudFormationRole', Helper.getCodePipelineCloudFormationRoleArn(targetAccountID, projectName), { mutable: false });
    const targetAccountCrossAccountRole = iam.Role.fromRoleArn(this, 'TargetAccountCrossAccountRole', Helper.getCodePipelineCrossAccountRoleArn(targetAccountID, projectName), { mutable: false });

    const builtArtifactsRegion = props.builtArtifactsBucket?.region || Regions.USWest2;
    const builtArtifactsBucket = s3.Bucket.fromBucketName(this, 'ArtifactsBucket', Helper.getBuiltArtifactsBucketName(projectName, builtArtifactsRegion));

    const sourceOutput = new cp.Artifact('SourceOutputArtifact');
    const intergationTestSourceOutput = new cp.Artifact('IntegrationTestSourceOutputArtifact');
    const endToEndTestSourceOutput = new cp.Artifact('EndToEndTestSourceOutputArtifact');
    const zapScanOutput = new cp.Artifact('ZapScanOutput');

    const changeSetName = `${pipelinePrefix}-${lambdaNameWithDashes}-changeset-deploy`;
    const stackName = `${pipelinePrefix}-${lambdaNameWithDashes}-changeset`;
    let inputArtifactsName = sourceOutput.artifactName ?? '';

    let crossRegionReplicationBuckets = {}
    let deployStages = []

    for (let region of regions) {
      if (!props.pipelineArtifactsBuckets.kmsKeyIds[region]) throw new Error(`No KMS key ID for region: ${region}`);
      const storedArtifactKMSKeyId = props.pipelineArtifactsBuckets.kmsKeyIds[region];
      const storedArtifactKMSKey = kms.Key.fromKeyArn(this, `StoredArtifactKMSKey-${region}`, `arn:aws:kms:${region}:${currentAccount}:key/${storedArtifactKMSKeyId}`);
      const storedArtifactsBucket = s3.Bucket.fromBucketName(this, `StoredArtifactsBucket-${region}`, Helper.getPipelineArtifactsBucketName(projectName, region, props.pipelineArtifactsBuckets.bucketName, props.pipelineArtifactsBuckets.suffix));
      (storedArtifactsBucket as any).encryptionKey = storedArtifactKMSKey //Need to do it this way for KMS key
      crossRegionReplicationBuckets[region] = storedArtifactsBucket

      const parameterOverrides = {
        GatewayAccount: props.target.gateway?.accountId,
        Environment: environment,
        ...props.parameterOverrides?.overrides,
        ...props.parameterOverrides?.regionalOverrides?.[region]
      }
      // GatewayId is optional, but you can still pass in Gateway Account
      if (props.target.gateway?.gatewayIds) {
        parameterOverrides['ApiGatewayID'] = props.target.gateway?.gatewayIds[region]
      }

      deployStages.push({
        stageName: `DeployApplication-${region}`,
        actions: [
          new cpa.CloudFormationCreateReplaceChangeSetAction({
            actionName: `CreateChangeSet`,
            region: region,
            changeSetName: changeSetName,
            stackName: stackName,
            adminPermissions: false,
            capabilities: [cfn.CloudFormationCapabilities.NAMED_IAM, cfn.CloudFormationCapabilities.AUTO_EXPAND],
            templatePath: cp.ArtifactPath.artifactPath(inputArtifactsName, 'deploy-template.yaml'),
            parameterOverrides,
            account: targetAccountID,
            deploymentRole: targetAccountCloudFormationRole,
            role: targetAccountCrossAccountRole,
            runOrder: 1
          }),
          new cpa.CloudFormationExecuteChangeSetAction({
            actionName: `ExecuteChangeSet`,
            region: region,
            changeSetName: changeSetName,
            stackName: stackName,
            account: targetAccountID,
            role: targetAccountCrossAccountRole,
            runOrder: 2
          })
        ]
      })
    }

    const pipeline = new cp.Pipeline(this, 'DeployPipeline', {
      pipelineName: `${pipelinePrefix}-${lambdaName}-${environment}-deploy-pipeline`,
      role: codePipelineExecutionRole,
      crossRegionReplicationBuckets
    });

    const sourceActions: cp.IAction[] = [
      new cpa.S3SourceAction({
        actionName: 'SourceS3',
        bucket: builtArtifactsBucket,
        bucketKey: `lambdas/${lambdaName}/builds/${lambdaName}_packaged_cfn_script.zip`,
        trigger: cpa.S3Trigger.NONE,
        output: sourceOutput,
        role: codePipelineExecutionRole
      })
    ];
    if (integrationTestsEnabled) {
      sourceActions.push(
        new cpa.GitHubSourceAction({
          actionName: 'CheckoutForIntegrationTests',
          owner: props.integrationTests?.source.owner || 'clublabs',
          repo: props.integrationTests?.source.repo || '',
          oauthToken: cdk.SecretValue.secretsManager(constants.GITHUB_OAUTH_TOKEN_SECRET_NAME),
          output: intergationTestSourceOutput,
          trigger: cpa.GitHubTrigger.NONE,
          branch: props.integrationTests?.source.branch || 'main'
        })
      )
    }
    if (endToEndTestsEnabled) {
      sourceActions.push(
        new cpa.GitHubSourceAction({
          actionName: 'CheckoutForEndToEndTests',
          owner: props.endToEndTests?.source.owner || 'clublabs',
          repo: props.endToEndTests?.source.repo || '',
          oauthToken: cdk.SecretValue.secretsManager(constants.GITHUB_OAUTH_TOKEN_SECRET_NAME),
          output: endToEndTestSourceOutput,
          trigger: cpa.GitHubTrigger.NONE,
          branch: props.endToEndTests?.source.branch || 'main'
        })
      )
    }
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

    for (let stage of deployStages) {
      pipeline.addStage(stage);
    }

    const integrationTestRoleArn = Helper.getIntegrationTestRoleArn(targetAccountID, projectName);
    const sharedCodeBuildProps = {
      actionName: 'CodeBuildTestAction',
      type: cpa.CodeBuildActionType.TEST,
      role: codePipelineExecutionRole,
      environmentVariables: {
        TEST_ENV: {
          value: environment
        },
        TARGET_ROLE_ARN: {
          value: integrationTestRoleArn
        },
        APP_NAME: {
          value: lambdaName
        }
      }
    }

    if (integrationTestsEnabled) {
      let actions = [];
      for (let region of regions) {
        const codeBuildName = props.integrationTests?.codebuildProjectNames?.[region] || `${props.pipelinePrefix}-integration-test-${region}`;
        const integrationTestName = cb.Project.fromProjectName(this, `IntegrationTest-${region}`, codeBuildName)

        actions.push(
          new cpa.CodeBuildAction({
            project: integrationTestName,
            input: intergationTestSourceOutput,
            region: region,
            ...sharedCodeBuildProps,
            actionName: `CodeBuildTestAction-${region}`,
            runOrder: 1
          } as CodeBuildActionProps));
      }

      pipeline.addStage({
        stageName: 'IntegrationTests',
        actions
      });
    }

    if (endToEndTestsEnabled) {
      let actions = [];
      for (let region of regions) {
        const codeBuildName = props.endToEndTests?.codebuildProjectNames?.[region] || `${props.pipelinePrefix}-endtoend-test-${region}`;
        const endToEndTestName = cb.Project.fromProjectName(this, `EndToEndTest-${region}`, codeBuildName);

        actions.push(
          new cpa.CodeBuildAction({
            actionName: `TestAction-${region}`,
            project: endToEndTestName,
            input: endToEndTestSourceOutput,
            region: region,
            ...sharedCodeBuildProps
          } as CodeBuildActionProps))

      }

      pipeline.addStage({
        stageName: 'EndToEndTests',
        actions
      });

    }

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
      const notificationRuleName = `${pipelinePrefix}-${lambdaName}-${environment}-deploy-notification`;
      addPipelineNotification(this, currentAccount, notificationRuleName, pipeline.pipelineArn, props.notifications.chatbotChannelName);
    }

    tag.addTeamTags(this, props.tags['ace:team'], props.teamTags);
  }
}
