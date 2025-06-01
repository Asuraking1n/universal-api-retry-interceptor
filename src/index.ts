import {
  RetryConfig,
  RequestMetadata,
  PendingRequest,
  InterceptorStatus,
} from "./types";

interface OriginalMethods {
  fetch: typeof fetch;
  XMLHttpRequest: typeof XMLHttpRequest;
}

class UniversalApiRetryInterceptor {
  private config: Required<RetryConfig>;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private isOnline: boolean = navigator.onLine;
  private retryTimer: number | null = null;
  private originalMethods: OriginalMethods;
  private isActive: boolean = false;

  constructor(config: RetryConfig = {}) {
    this.config = {
      delayTime: config.delayTime ?? 1000,
      retryInterval: config.retryInterval ?? 5000,
      maxRetries: config.maxRetries ?? 3,
      retryCondition: config.retryCondition ?? this.defaultRetryCondition,
      onRetry: config.onRetry ?? (() => {}),
      onMaxRetriesExceeded: config.onMaxRetriesExceeded ?? (() => {}),
      enableLogging: config.enableLogging ?? false,
    };

    this.originalMethods = {
      fetch: window.fetch.bind(window),
      XMLHttpRequest: window.XMLHttpRequest,
    };
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[Universal API Interceptor] ${message}`, ...args);
    }
  }

  private defaultRetryCondition(error: any, response?: Response): boolean {
    if (
      !response &&
      (error?.name === "TypeError" || error?.message?.includes("fetch"))
    ) {
      return true;
    }

    if (response) {
      const status = response.status;
      return status >= 500 || status === 408 || status === 429 || status === 0;
    }

    return false;
  }

  public start(): void {
    if (this.isActive) {
      this.log("Interceptor already active");
      return;
    }

    this.interceptFetch();
    this.interceptXMLHttpRequest();
    this.setupNetworkListeners();
    this.startRetryLoop();
    this.isActive = true;
    this.log("Universal API Interceptor started");
  }

  public stop(): void {
    if (!this.isActive) return;

    window.fetch = this.originalMethods.fetch;
    window.XMLHttpRequest = this.originalMethods.XMLHttpRequest;

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    this.clearPendingRequests();
    this.isActive = false;
    this.log("Universal API Interceptor stopped");
  }

  private interceptFetch(): void {
    const originalFetch = this.originalMethods.fetch;
    const self = this;

    window.fetch = async function (
      input: globalThis.RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = typeof input === "string" ? input : input.toString();
      const options = { ...init };

      try {
        const response = await originalFetch(input, init);

        if (!response.ok && self.config.retryCondition(null, response)) {
          return self.handleFailedRequest(url, options, null, response);
        }

        return response;
      } catch (error) {
        if (self.config.retryCondition(error)) {
          try {
            return await self.handleFailedRequest(url, options, error);
          } catch (retryError: any) {
            // Handle interceptor-specific errors gracefully
            if (retryError.message === "INTERCEPTOR_CLEARED") {
              // Return a resolved promise with a synthetic response for cleared requests
              return new Response(null, {
                status: 499,
                statusText: "Request Cleared",
              });
            } else if (retryError.name === "MaxRetriesExceeded") {
              // Don't throw the error, let onMaxRetriesExceeded handle it
              throw new Error(
                `Request failed after ${self.config.maxRetries} retry attempts`
              );
            }
            throw retryError;
          }
        }
        throw error;
      }
    };
  }

  private interceptXMLHttpRequest(): void {
    const OriginalXHR = this.originalMethods.XMLHttpRequest;
    const self = this;

    // Create a proper constructor function that matches XMLHttpRequest signature
    const InterceptedXHR = function (this: XMLHttpRequest) {
      const xhr = new OriginalXHR();
      const originalSend = xhr.send;
      const originalOpen = xhr.open;

      let requestMethod: string = "";
      let requestUrl: string = "";
      let requestData: any;

      // Override open method with proper typing
      xhr.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        user?: string | null,
        password?: string | null
      ) {
        requestMethod = method;
        requestUrl = typeof url === "string" ? url : url.toString();

        // Call original open with proper arguments based on what was provided
        const urlString = typeof url === "string" ? url : url.toString();

        // Use type assertion to bypass strict TypeScript checking
        const originalOpenAny = originalOpen as any;

        // FIXED: Proper argument handling with type assertion
        if (arguments.length === 2) {
          return originalOpenAny.call(this, method, urlString);
        } else if (arguments.length === 3) {
          return originalOpenAny.call(this, method, urlString, async);
        } else if (arguments.length === 4) {
          return originalOpenAny.call(this, method, urlString, async, user);
        } else if (arguments.length >= 5) {
          return originalOpenAny.call(
            this,
            method,
            urlString,
            async,
            user,
            password
          );
        }
      };

      xhr.send = function (data?: Document | XMLHttpRequestBodyInit | null) {
        requestData = data;

        const originalOnError = xhr.onerror;
        const originalOnLoad = xhr.onload;

        xhr.onerror = function (event: ProgressEvent<EventTarget>) {
          if (self.config.retryCondition({ name: "NetworkError" })) {
            const options: RequestInit = {
              method: requestMethod,
              body: requestData,
              headers: self.extractXHRHeaders(xhr),
            };

            self.handleFailedXHRRequest(requestUrl, options, xhr);
            return;
          }
          if (originalOnError) originalOnError.call(xhr, event);
        };

        xhr.onload = function (event: ProgressEvent<EventTarget>) {
          if (
            xhr.status >= 400 &&
            self.config.retryCondition(null, { status: xhr.status } as Response)
          ) {
            const options: RequestInit = {
              method: requestMethod,
              body: requestData,
              headers: self.extractXHRHeaders(xhr),
            };

            self.handleFailedXHRRequest(requestUrl, options, xhr);
            return;
          }
          if (originalOnLoad) originalOnLoad.call(xhr, event);
        };

        return originalSend.call(this, data);
      };

      return xhr;
    } as any as {
      new (): XMLHttpRequest;
      prototype: XMLHttpRequest;
      readonly UNSENT: 0;
      readonly OPENED: 1;
      readonly HEADERS_RECEIVED: 2;
      readonly LOADING: 3;
      readonly DONE: 4;
    };

    // Copy prototype
    InterceptedXHR.prototype = OriginalXHR.prototype;

    // Use Object.defineProperty to copy read-only constants
    Object.defineProperty(InterceptedXHR, "UNSENT", {
      value: OriginalXHR.UNSENT,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(InterceptedXHR, "OPENED", {
      value: OriginalXHR.OPENED,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(InterceptedXHR, "HEADERS_RECEIVED", {
      value: OriginalXHR.HEADERS_RECEIVED,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(InterceptedXHR, "LOADING", {
      value: OriginalXHR.LOADING,
      writable: false,
      enumerable: true,
      configurable: false,
    });
    Object.defineProperty(InterceptedXHR, "DONE", {
      value: OriginalXHR.DONE,
      writable: false,
      enumerable: true,
      configurable: false,
    });

    // Copy any other static properties (avoiding the read-only constants)
    Object.getOwnPropertyNames(OriginalXHR).forEach((prop) => {
      const descriptor = Object.getOwnPropertyDescriptor(OriginalXHR, prop);
      const excludedProps = [
        "UNSENT",
        "OPENED",
        "HEADERS_RECEIVED",
        "LOADING",
        "DONE",
        "prototype",
      ];

      // Check if prop is in excluded list (compatible with older JS targets)
      let isExcluded = false;
      for (let i = 0; i < excludedProps.length; i++) {
        if (excludedProps[i] === prop) {
          isExcluded = true;
          break;
        }
      }

      if (descriptor && !isExcluded) {
        try {
          Object.defineProperty(InterceptedXHR, prop, descriptor);
        } catch (e) {
          // Ignore properties that can't be copied
        }
      }
    });

    window.XMLHttpRequest = InterceptedXHR;
  }

  private extractXHRHeaders(xhr: XMLHttpRequest): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  private async handleFailedXHRRequest(
    url: string,
    options: RequestInit,
    originalXHR: XMLHttpRequest
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        id: this.generateRequestId(),
        url,
        options,
        retryCount: 0,
        timestamp: Date.now(),
        resolve: (response: Response) => {
          response.text().then((text) => {
            Object.defineProperty(originalXHR, "responseText", { value: text });
            Object.defineProperty(originalXHR, "status", {
              value: response.status,
            });
            Object.defineProperty(originalXHR, "readyState", { value: 4 });
            if (originalXHR.onload) {
              // Create a proper mock ProgressEvent
              const mockEvent = new Event("load") as ProgressEvent<EventTarget>;
              Object.defineProperty(mockEvent, "lengthComputable", {
                value: false,
              });
              Object.defineProperty(mockEvent, "loaded", { value: 0 });
              Object.defineProperty(mockEvent, "total", { value: 0 });
              Object.defineProperty(mockEvent, "target", {
                value: originalXHR,
              });

              originalXHR.onload.call(originalXHR, mockEvent);
            }
            resolve();
          });
        },
        reject: (error) => {
          // Only reject if this isn't a cleared request
          if (error.message !== "INTERCEPTOR_CLEARED") {
            reject(error);
          }
          // Silently handle cleared requests
        },
      };

      this.pendingRequests.set(pendingRequest.id, pendingRequest);
      this.log(`Stored XHR request ${pendingRequest.id} for retry`);
    });
  }

  private async handleFailedRequest(
    url: string,
    options: RequestInit,
    error?: any,
    response?: Response
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        id: this.generateRequestId(),
        url,
        options,
        retryCount: 0,
        timestamp: Date.now(),
        resolve,
        reject: (error) => {
          // Only reject if this isn't a cleared request
          if (error.message !== "INTERCEPTOR_CLEARED") {
            reject(error);
          }
          // Silently handle cleared requests
        },
      };

      this.pendingRequests.set(pendingRequest.id, pendingRequest);
      this.log(`Stored request ${pendingRequest.id} for retry. URL: ${url}`);
    });
  }

  private setupNetworkListeners(): void {
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);

    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  private handleOnline = (): void => {
    this.log("Network back online - retrying pending requests");
    this.isOnline = true;
    this.retryPendingRequests();
  };

  private handleOffline = (): void => {
    this.log("Network went offline - storing requests for later");
    this.isOnline = false;
  };

  private startRetryLoop(): void {
    const retryLoop = () => {
      if (this.isOnline && this.pendingRequests.size > 0) {
        this.retryPendingRequests();
      }
      this.retryTimer = window.setTimeout(retryLoop, this.config.retryInterval);
    };

    retryLoop();
  }

  private async retryPendingRequests(): Promise<void> {
    const requestsToRetry = Array.from(this.pendingRequests.values());

    for (const request of requestsToRetry) {
      const timeSinceLastAttempt = Date.now() - request.timestamp;
      if (timeSinceLastAttempt < this.config.delayTime) {
        continue;
      }

      try {
        request.retryCount++;
        request.timestamp = Date.now();

        this.config.onRetry(null, request.retryCount, {
          url: request.url,
          options: request.options,
        });
        this.log(
          `Retrying request ${request.id} (attempt ${request.retryCount}/${this.config.maxRetries})`
        );

        const response = await this.originalMethods.fetch(
          request.url,
          request.options
        );

        if (response.ok || !this.config.retryCondition(null, response)) {
          this.pendingRequests.delete(request.id);
          request.resolve(response);
          this.log(
            `Request ${request.id} succeeded on retry ${request.retryCount}`
          );
        } else if (request.retryCount >= this.config.maxRetries) {
          this.pendingRequests.delete(request.id);
          this.config.onMaxRetriesExceeded(null, {
            url: request.url,
            options: request.options,
          });
          request.reject(new Error(`Max retries exceeded for ${request.url}`));
          this.log(
            `Request ${request.id} failed after ${request.retryCount} retries`
          );
        }
      } catch (error: any) {
        if (request.retryCount >= this.config.maxRetries) {
          this.pendingRequests.delete(request.id);
          this.config.onMaxRetriesExceeded(error, {
            url: request.url,
            options: request.options,
          });
          request.reject(error);
          this.log(
            `Request ${request.id} failed after ${request.retryCount} retries:`,
            error
          );
        } else if (!this.config.retryCondition(error)) {
          this.pendingRequests.delete(request.id);
          request.reject(error);
          this.log(
            `Request ${request.id} failed with non-retryable error:`,
            error
          );
        }
      }
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  public clearPendingRequests(): void {
    this.pendingRequests.forEach((request) => {
      // Silently reject with a special flag to indicate this was intentional
      request.reject(new Error("INTERCEPTOR_CLEARED"));
    });
    this.pendingRequests.clear();
    this.log("Cleared all pending requests");
  }

  public updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log("Configuration updated", newConfig);
  }

  public getStatus(): InterceptorStatus {
    return {
      isActive: this.isActive,
      isOnline: this.isOnline,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

let globalInterceptor: UniversalApiRetryInterceptor | null = null;

export function createApiInterceptor(
  config?: RetryConfig
): UniversalApiRetryInterceptor {
  return new UniversalApiRetryInterceptor(config);
}

export function startGlobalInterceptor(
  config?: RetryConfig
): UniversalApiRetryInterceptor {
  if (!globalInterceptor) {
    globalInterceptor = new UniversalApiRetryInterceptor(config);
  }
  globalInterceptor.start();
  return globalInterceptor;
}

export function stopGlobalInterceptor(): void {
  if (globalInterceptor) {
    globalInterceptor.stop();
  }
}

export function getGlobalInterceptor(): UniversalApiRetryInterceptor | null {
  return globalInterceptor;
}

export default UniversalApiRetryInterceptor;
