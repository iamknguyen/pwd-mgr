import { Regions } from "./Regions";

export interface DeployTargetProps {
  accountId: string;
  environment: string;
  gateway?: DeployTargetGatewayProps;

  /**
   * Parameter specifying which regions to deploy to
   * @default Deploys to both regions (us-west-2, us-east-1)
   */
  regions?: Regions[];
}

export interface DeployTargetGatewayProps {
  accountId: string;
  gatewayIds?: {
    [key in Regions]?: string;
  }
}

export interface DeployTargetParameterOverridesProps {
  /**
   * Parameter overrides for all regions
   */
  overrides?: { [name: string]: string },
  /**
   * Parameter overrides for a specific region
   */
  regionalOverrides?: {
    [key in Regions]: { [name: string]: string }
  }
}