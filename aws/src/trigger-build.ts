import * as cdk from '@aws-cdk/core';
import * as cb from '@aws-cdk/aws-codebuild';
import * as iam from '@aws-cdk/aws-iam';

export interface TriggerBuildProps {
  /**
   * Will append -build-trigger to the project name
   */
  codebuildProjectName: string;
  codeBuildServiceRole: iam.IRole;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  webhookFilters: string[];
  pipelineName: string;
}

export function createTriggerCodeBuildProject(scope: cdk.Construct, props: TriggerBuildProps) {
  const webhookFilters = props.webhookFilters.map(f => cb.FilterGroup
    .inEventOf(cb.EventAction.PUSH)
    .andBranchIs(props.githubBranch)
    .andFilePathIs(f)
    .andTagIsNot(`.*`)
  );

  new cb.Project(scope, 'TriggerBuildProject', {
    projectName: `${props.codebuildProjectName}-build-trigger`,
    description: `Trigger build in CodePipeline for ${props.codebuildProjectName}`,
    role: props.codeBuildServiceRole,
    source: cb.Source.gitHub({
      owner: props.githubOwner,
      repo: props.githubRepo,
      branchOrRef: props.githubBranch,
      cloneDepth: 1,
      webhookFilters: [
        ...webhookFilters
      ]
    }),
    buildSpec: cb.BuildSpec.fromObject({
      "version": 0.2,
      "env": {
        "git-credential-helper": "yes"
      },
      "phases": {
        "build": {
          "commands": [
            `aws codepipeline start-pipeline-execution --name ${props.pipelineName}`
          ]
        }
      }
    }),
    environment: {
      buildImage: cb.LinuxBuildImage.STANDARD_5_0,
      computeType: cb.ComputeType.SMALL
    }
  });
}