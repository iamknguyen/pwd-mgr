export interface IServiceError {
  ErrorMessage: string;
  ComponentName: string;
  CorrelationId: string;
  ComponentErrorCode?: number;
  Metadata?: any;
  Severity?: string;
}

export class ServiceError implements IServiceError {
  constructor(
    public ErrorMessage: any,
    public ComponentName: string,
    public CorrelationId: string,
    public ComponentErrorCode?: number,
    public Metadata?: any,
    public Severity?: string,
  ) {}
}