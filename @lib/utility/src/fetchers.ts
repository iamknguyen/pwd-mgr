import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';
import https from 'https';
import uuid4 from 'uuid4';
import { handleServiceResponseError } from './handleServiceResponseError';
import { logger } from './logger';

dotenv.config();

export function generateRequestId(): string {
  return uuid4();
}

export const createRequestHeaders = (req?: any): ConfigOptions => {
  if(!req) {
    return  {
      requestId: generateRequestId(),
      headerInfo: {}
    }
  }
  return {
    requestId: req?.headers?.['X-Request-Id'] || req?.headers?.['X-Ace-Correlation-Id'] || generateRequestId(),
    headerInfo: {
      'X-Ace-Session-Id': req?.headers ? req?.headers['x-ace-session-id'] ? req?.headers['x-ace-session-id'] : 'N/A' : 'N/A'
    }
  };
};

export function createRequestConfig(options?: ConfigOptions): AxiosRequestConfig {
  return {
    headers: {
      ...options?.headerInfo,
      'X-Ace-Correlation-Id': options?.requestId || generateRequestId()
    }
  };
}

export interface ConfigOptions {
  requestId: string;
  headerInfo: { [key: string]: string };
}

/**
 * Use the https instance on prod, but for development will just need an http instance
 * @param optHeaders optional headers
 */
export function createAxiosInstance(optHeaders?): AxiosInstance {
  let disableHTTPS = process.env.NODE_ENV === 'development';
  if (process.env.ENABLE_HTTPS === 'true') {
    disableHTTPS = false;
  }
  
  if (!disableHTTPS) {
    logger.debug('HTTPS enabled', {});
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    const defaultHeaders = {
      // 'X-Frame-Options': 'sameorigin',
      // 'X-XSS-Protection': '1; mode=block',
      // 'X-Content-Type-Options': 'nosniff',
      // 'Content-Security-Policy': 'default-src \'self\'',
      // 'Connection': 'Keep-Alive',
      'Accept': 'application/json, application/xml, text/plain, */*'
    };

    const httpsInstance: AxiosInstance = axios.create({
      httpsAgent: agent,
      headers: optHeaders ? { ...defaultHeaders, ...optHeaders } : defaultHeaders
    });
    return httpsInstance;
  }

  return axios.create({
    headers: optHeaders ? optHeaders : {}
  });
}

export const axiosInstance: AxiosInstance = createAxiosInstance();

type AsyncFunction<I, O> = (inputs?: I) => Promise<O>;
function buildResponse(response, logObject, enableBrowserLog) {
  return !enableBrowserLog ? response.data : { apiResponse: response.data, logObject };
}

export function RemotePost<RequestBody, Response>(
  endpoint: string, config?: AxiosRequestConfig, enableBrowserLog?: boolean)
  : AsyncFunction<RequestBody, Response> {
  return async (requestBody: RequestBody) => {
    const requestStartTime = Date.now();
    const logObject = {
      'url': endpoint,
      'request-body': requestBody,
      'X-Ace-Correlation-Id': config && config.headers && config.headers['X-Ace-Correlation-Id']
    };
    try {
      const response = await axiosInstance.post(endpoint, requestBody, config);
      const requestEndTime = Date.now();
      return Promise.resolve(buildResponse(
        response,
        { ...logObject, status: response.status, response_time: requestEndTime - requestStartTime },
        enableBrowserLog)
      );
    } catch (error) {
      const errorResponse = handleServiceResponseError(error);
      const requestEndTime = Date.now();
      return !enableBrowserLog ? errorResponse :
        {
          apiResponse: errorResponse,
          logObject: { ...logObject, status: error.response.status, response_time: requestEndTime - requestStartTime }
        };
    }
  };
}

export function RemotePut<RequestBody, Response>(
  endpoint: string,
  config?: AxiosRequestConfig,
  enableBrowserLog?: boolean)
  : AsyncFunction<RequestBody, Response> {
  return async (requestBody: RequestBody) => {
    const requestStartTime = Date.now();
    const logObject = {
      'url': endpoint,
      'request-body': requestBody,
      'X-Ace-Correlation-Id': config && config.headers && config.headers['X-Ace-Correlation-Id']
    };
    try {
      const requestEndTime = Date.now();
      const response = await axiosInstance.put(endpoint, requestBody, config);
      return Promise.resolve(buildResponse(
        response,
        { ...logObject, status: response.status, response_time: requestEndTime - requestStartTime },
        enableBrowserLog)
      );
    } catch (error) {
      const errorResponse = handleServiceResponseError(error);
      const requestEndTime = Date.now();
      return !enableBrowserLog ? errorResponse :
        {
          apiResponse: errorResponse,
          logObject: { ...logObject, status: error.response.status, response_time: requestEndTime - requestStartTime }
        };
    }
  };
}

export function RemoteGet<RequestBody, Response>(
  endpoint: string,
  config?: AxiosRequestConfig,
  enableBrowserLog?: boolean)
  : AsyncFunction<RequestBody, Response> {
  return async (requestBody: RequestBody) => {
    const requestStartTime = Date.now();
    const logObject = {
      'url': endpoint,
      'request-body': requestBody,
      'X-Ace-Correlation-Id': config && config.headers && config.headers['X-Ace-Correlation-Id']
    };
    try {
      const requestEndTime = Date.now();
      const response = await axiosInstance.get(endpoint, { ...config, params: requestBody });
      return Promise.resolve(buildResponse(
        response,
        { ...logObject, status: response.status, response_time: requestEndTime - requestStartTime },
        enableBrowserLog)
      );
    } catch (error) {
      const errorResponse = handleServiceResponseError(error);
      const requestEndTime = Date.now();
      return !enableBrowserLog ? errorResponse :
        {
          apiResponse: errorResponse,
          logObject: { ...logObject, status: error.response.status, response_time: requestEndTime - requestStartTime }
        };
    }
  };
}

export function RemoteDelete<RequestBody, Response>(
  endpoint: string,
  config?: AxiosRequestConfig,
  enableBrowserLog?: boolean)
  : AsyncFunction<RequestBody, Response> {
  return async (requestBody: RequestBody) => {
    const requestStartTime = Date.now();
    const logObject = {
      'url': endpoint,
      'request-body': requestBody,
      'X-Ace-Correlation-Id': config && config.headers && config.headers['X-Ace-Correlation-Id']
    };
    try {
      const requestEndTime = Date.now();
      const response = await axiosInstance.delete(endpoint, { ...config, params: requestBody });
      return Promise.resolve(buildResponse(
        response,
        { ...logObject, status: response.status, response_time: requestEndTime - requestStartTime },
        enableBrowserLog)
      );
    } catch (error) {
      const errorResponse = handleServiceResponseError(error);
      const requestEndTime = Date.now();
      return !enableBrowserLog ? errorResponse :
      {
        apiResponse: errorResponse,
        logObject: { ...logObject, status: error.response.status, response_time: requestEndTime - requestStartTime }
      };
    }
  };
}
