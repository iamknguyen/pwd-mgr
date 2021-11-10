import { Regions } from "./Regions";

export interface BuiltArtifactsProps {
  accountId: string;
  kmsKeyId: string;
  /**
   * @default - us-west-2
   */
  region?: Regions;
}
