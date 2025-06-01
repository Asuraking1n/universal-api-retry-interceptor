export interface RetryConfig {
  delayTime?: number;
  retryInterval?: number;
  maxRetries?: number;
  retryCondition?: (error: any, response?: Response) => boolean;
  onRetry?: (
    error: any,
    retryCount: number,
    requestInfo: RequestMetadata
  ) => void;
  onMaxRetriesExceeded?: (error: any, requestInfo: RequestMetadata) => void;
  enableLogging?: boolean;
}

export interface RequestMetadata {
  url: string;
  options: RequestInit;
}

export interface PendingRequest {
  id: string;
  url: string;
  options: RequestInit;
  retryCount: number;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export interface InterceptorStatus {
  isActive: boolean;
  isOnline: boolean;
  pendingRequests: number;
}
