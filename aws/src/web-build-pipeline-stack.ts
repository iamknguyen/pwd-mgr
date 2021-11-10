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
import { createTriggerCodeBuildProject } from './trigger-build';
import { addPipelineNotification } from './pipeline-notification';

interface WebBuildPipelineStackProps extends cdk.StackProps {
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
  source: BuildSourceProps,
  build: {
    buildSpecPath: string;
    /**
     * @default - packaged_build_artifact.zip
     */
    artifactName?: string;
    /**
     * @default - web/builds
     */
    buildArtifactPath?: string;
  }
  builtArtifactsBucket: {
    kmsKeyIds: {
      [Regions.USWest2]: string;
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

export class WebBuildPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: WebBuildPipelineStackProps) {
    super(scope, id, props);

    const currentAccount = cdk.Stack.of(this).account;
    const projectName = props.projectName;
    const webName = props.webName ? `${props.projectName}-${props.webName}` : (projectName.endsWith('web') ? projectName : `${projectName}-web`);

    //Github
    const githubOwner = props.source.owner || 'clublabs';
    const githubBranch = props.source.branch || 'main';
    //Code Build
    const artifactName = props.build.artifactName || 'packaged_build_artifact.zip';
    const buildArtifactPath = props.build.buildArtifactPath || `web/builds`;

    const pipelineArtifactsRegion = props.pipelineArtifactsBucket.region || Regions.USWest2;
    const storedArtifactKMSKeyOregon = kms.Key.fromKeyArn(this, `StoredArtifactKMSKeyOregon`, `arn:aws:kms:${pipelineArtifactsRegion}:${currentAccount}:key/${props.pipelineArtifactsBucket.kmsKeyId}`);
    const storedArtifactsBucketOregon = s3.Bucket.fromBucketName(
      this, 'StoredArtifactsBucketOregon', 
      'Helper.getPipelineArtifactsBucketName(projectName, pipelineArtifactsRegion, props.pipelineArtifactsBucket.bucketName, props.pipelineArtifactsBucket.suffix)'
      );
    (storedArtifactsBucketOregon as any).encryptionKey = storedArtifactKMSKeyOregon //Need to do it this way for KMS key

    const codePipelineExecutionRole = iam.Role.fromRoleArn(
      this, 'CodePipelineExecutionRole', '`arn:aws:iam::${currentAccount}:role/${Helper.getCodePipelineExecutionRoleName(projectName)}`', { mutable: false });
    const codeBuildServiceRole = 
    iam.Role.fromRoleArn(this, 'CodeBuildServiceRole', '`arn:aws:iam::${currentAccount}:role/${Helper.getCodeBuildServiceRoleName(projectName)}`', { mutable: false });

    /////////////
    // Trigger //
    /////////////
    //This code build project will act as a trigger for the larger build pipeline
    //We have to do it this way because of our monorepo. 
    //AWS does not allow webhooks of specific folders outside of codebuild

    const pipelineName = `${webName}-build-pipeline`;
    createTriggerCodeBuildProject(this, {
      codebuildProjectName: webName,
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
      projectName: `${webName}-build`,
      description: `The build configuration for ${webName}`,
      //encryptionKey: builtArtifactsKMSKeyOregon,
      role: codeBuildServiceRole,
      buildSpec: cb.BuildSpec.fromSourceFilename(props.build.buildSpecPath),
      source: cb.Source.gitHub({
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
          BUILD_OUTPUT_PATH: {
            value: buildArtifactPath
          },
          BUILD_ARTIFACT_NAME: {
            value: artifactName
          },
          BUILD_KMS_KEY_ID_WEST: {
            value: props.builtArtifactsBucket.kmsKeyIds[Regions.USWest2]
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
          oauthToken: cdk.SecretValue.secretsManager('/service/github/acecloud/token'),
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
      const notificationRuleName = `${webName}-build-notification`;
      addPipelineNotification(this, currentAccount, notificationRuleName, pipeline.pipelineArn, props.notifications.chatbotChannelName);
    }

    // tag.addTeamTags(this, props.tags['ace:team'], props.teamTags);
  }

}
