import * as cdk from '@aws-cdk/core';
import * as cb from '@aws-cdk/aws-codebuild';
import * as cp from '@aws-cdk/aws-codepipeline';
import * as s3 from '@aws-cdk/aws-s3';
import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import { Regions } from "./types/Regions";
import { BuildPipelineArtifactsProps } from './types/PipelineArtifactsProps';
import { BuildSourceProps } from './types';
import { addPipelineNotification } from './pipeline-notification';
import { createTriggerCodeBuildProject } from './trigger-build';

interface LambdaBuildPipelineStackProps extends cdk.StackProps {
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
  source: BuildSourceProps,
  build: {
    buildSpecPath: string;
    /**
     * @default - ${lambdaName}_packaged_cfn_script.zip
     */
    artifactName?: string;
    /**
     * @default - lambdas/${lambdaName}/builds
     */
    buildArtifactPath?: string;
  }
  builtArtifactsBucket: {
    kmsKeyIds: {
      [key in Regions]: string;
    }
  };
  pipelineArtifactsBucket: BuildPipelineArtifactsProps;
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

export class LambdaBuildPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: LambdaBuildPipelineStackProps) {
    super(scope, id, props);

    const currentAccount = cdk.Stack.of(this).account;
    const projectName = props.projectName;

    //Github
    const githubOwner = props.source.owner || 'clublabs';
    const githubBranch = props.source.branch || 'main';
    //Lambda
    const lambdaName = props.lambdaName;
    //Code Build
    const pipelinePrefix = props.pipelinePrefix || projectName;
    const artifactName = props.build.artifactName || `${lambdaName}_packaged_cfn_script.zip`;
    const buildArtifactPath = props.build.buildArtifactPath || `lambdas/${lambdaName}/builds`;

    const pipelineArtifactsRegion = props.pipelineArtifactsBucket.region || Regions.USWest2;
    const storedArtifactKMSKeyOregon = kms.Key.fromKeyArn(this, `StoredArtifactKMSKeyOregon`, `arn:aws:kms:${pipelineArtifactsRegion}:${currentAccount}:key/${props.pipelineArtifactsBucket.kmsKeyId}`);
    const storedArtifactsBucketOregon = s3.Bucket.fromBucketName(
      this, 'StoredArtifactsBucketOregon', 
      'Helper.getPipelineArtifactsBucketName(projectName, pipelineArtifactsRegion, props.pipelineArtifactsBucket.bucketName, props.pipelineArtifactsBucket.suffix)'
      );
    (storedArtifactsBucketOregon as any).encryptionKey = storedArtifactKMSKeyOregon;

    const codePipelineExecutionRole = iam.Role.fromRoleArn(
      this, 'CodePipelineExecutionRole',
      'Helper.getCodePipelineExecutionRoleArn(currentAccount, projectName)', { mutable: false });
    const codeBuildServiceRole = iam.Role
      .fromRoleArn(this, 'CodeBuildServiceRole',
        'Helper.getCodeBuildServiceRoleArn(currentAccount, projectName)', { mutable: false });

    /////////////
    // Trigger //
    /////////////
    //This code build project will act as a trigger for the larger build pipeline
    //We have to do it this way because of our monorepo.
    //AWS does not allow webhooks of specific folders outside of codebuild

    const pipelineName = `${pipelinePrefix}-${lambdaName}-build-pipeline`;
    createTriggerCodeBuildProject(this, {
      codebuildProjectName: `${pipelinePrefix}-${lambdaName}`,
      codeBuildServiceRole,
      githubOwner,
      githubRepo: props.source.repo,
      githubBranch,
      webhookFilters: props.source.webhookFilters,
      pipelineName
    });

    ///////////////
    // CodeBuild //
    ///////////////
    const codeBuildProject = new cb.Project(this, 'CodeBuildProject', {
      projectName: `${pipelinePrefix}-${lambdaName}-build`,
      description: `The build configuration for ${pipelinePrefix} lambda: ${lambdaName}`,
      role: codeBuildServiceRole,
      buildSpec: cb.BuildSpec.fromSourceFilename(props.build.buildSpecPath),
      source: cb.Source.gitHub({ //This settings is not used but is needed
        owner: githubOwner,
        repo: props.source.repo
      }),
      environment: {
        buildImage: cb.LinuxBuildImage.STANDARD_5_0,
        computeType: cb.ComputeType.SMALL,
        environmentVariables: {
          BUILD_OUTPUT_BUCKET_WEST: {
            value: 'Helper.getBuiltArtifactsBucketName(projectName, Regions.USWest2)'
          },
          BUILD_OUTPUT_BUCKET_EAST: {
            value: 'Helper.getBuiltArtifactsBucketName(projectName, Regions.USEast1)'
          },
          BUILD_OUTPUT_PATH: {
            value: buildArtifactPath
          },
          BUILD_ARTIFACT_NAME: {
            value: artifactName
          },
          BUILD_KMS_KEY_ID_WEST: {
            value: props.builtArtifactsBucket.kmsKeyIds['us-west-2']
          },
          BUILD_KMS_KEY_ID_EAST: {
            value: props.builtArtifactsBucket.kmsKeyIds['us-east-1']
          },
          GITHUB_BRANCH: {
            value: githubBranch
          }
        }
      }
    });

    //////////////////
    // CodePipeline //
    //////////////////

    const pipeline = new cp.Pipeline(this, 'Pipeline', {
      pipelineName,
      restartExecutionOnUpdate: true,
      role: codePipelineExecutionRole,
      artifactBucket: storedArtifactsBucketOregon
    });

    const sourceOutput = new cp.Artifact();

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpa.GitHubSourceAction({
          actionName: 'Checkout',
          owner: githubOwner,
          repo: props.source.repo,
          oauthToken: cdk.SecretValue.secretsManager('/service/github/iamknguyen/token'),
          output: sourceOutput,
          trigger: cpa.GitHubTrigger.NONE,
          branch: githubBranch
        })
      ]
    });

    const nexusIQArtifact = new cp.Artifact("nexusiq");
    const codeBuildAction = new cpa.CodeBuildAction({
      actionName: 'CodeBuildAction',
      project: codeBuildProject,
      input: sourceOutput,
      outputs: [
        nexusIQArtifact
      ],
      role: codePipelineExecutionRole
    });
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        codeBuildAction
      ],
    });



    //CodePipeline Notifications > Chatbot
    if (props.notifications) {
      const notificationRuleName = `${pipelinePrefix}-${lambdaName}-build-notification`;
      addPipelineNotification(this, currentAccount, notificationRuleName, pipeline.pipelineArn, props.notifications.chatbotChannelName);
    }

    // tag.addTeamTags(this, props.tags['ace:team'], props.teamTags);
  }

}
