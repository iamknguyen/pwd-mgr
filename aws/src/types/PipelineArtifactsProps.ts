import { Regions } from "./Regions";

export interface BuildPipelineArtifactsProps {
  kmsKeyId: string;
  /**
   * Bucket name is a combination of the projectName + bucketName + suffix + region
   * @default - ppln-strd-artifacts
   */
  bucketName?: string;
  /**
   * Pipeline Artifacts suffix. Since this is a build pipeline, most likely this is nonprod
   * @default - nonprod
   */
  suffix?: PipelineArtifactsBucketSuffix;
  /**
   * @default - us-west-2
   */
  region?: Regions;
}

export interface DeployPipelineArtifactsProps {
  /**
   * Bucket name is a combination of the projectName + bucketName + suffix + region
   * @default - ppln-strd-artifacts
   */
  bucketName?: string;
  /**
   * Pipeline Artifacts suffix.
   * @default - nonprod
   */
  suffix?: PipelineArtifactsBucketSuffix;
  kmsKeyIds: {
    [key in Regions]?: string;
  }
}

export enum PipelineArtifactsBucketSuffix {
  Nonprod = "nonprod",
  Prod = "prod"
}
