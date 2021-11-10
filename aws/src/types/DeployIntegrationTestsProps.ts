import { Regions } from "./Regions";

export interface DeployIntegrationTestsProps {
  /**
   * Enable integration/ui tests for this pipeline
   */
  enabled: boolean;

  /**
   * Github repo for integration/ui tests
   */
  source: {
    repo: string;
    /**
     * @default - clublabs
     */
    owner?: string;
    /**
     * @default - main
     */
    branch?: string;
  };

  /**
   * Project names for CodeBuild
   * @default - `${pipelinePrefix}-integration-test-${region}`
   * @default - `${pipelinePrefix}-endtoend-test-${region}`
   */
  codebuildProjectNames?: {
    [key in Regions]: string;
  }
}
