export interface BuildSourceProps {
  repo: string;
  /**
   * List of regex conditions for the trigger bucket
   * @param pattern a regular expression.
   */
  webhookFilters: string[]
  /**
   * @default - clublabs
   */
  owner?: string;
  /**
   * @default - main
   */
  branch?: string;
}