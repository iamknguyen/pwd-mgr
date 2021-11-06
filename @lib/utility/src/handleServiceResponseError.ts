import { AxiosError } from 'axios';
import { ServiceError } from './Error';

export const handleServiceResponseError = <T>(error: AxiosError | Error): Promise<T> => {
  const serviceError: ServiceError = new ServiceError(
    'Generic Service Error',
    'componentName',
    'id',
    500,
    'Some Metadata',
    'High Severity'
  );

  if (!error) {
    return Promise.reject(serviceError);
  }

  const axiosError = error as AxiosError; // AxiosError extends Error

  if (axiosError.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    serviceError.ComponentErrorCode = axiosError.response.status;
    if (axiosError.response.data) {
      serviceError.ErrorMessage = axiosError.response.data; // { Error: message } is what DP will return
      if (axiosError.response.data.Error?.ComponentName) {
        serviceError.ComponentName = axiosError.response.data.Error.ComponentName;
      }
      if (axiosError.response.data.Error?.Severity) {
        serviceError.Severity = axiosError.response.data.Error.Severity;
      }
    }
    if (axiosError.response.headers['X-Ace-Correlation-Id'] || axiosError.response.headers['X-Request-Id']) {
      // { Error: message } is what DP will return
      serviceError.CorrelationId = axiosError.response.headers['X-Ace-Correlation-Id'] || axiosError.response.headers['X-Request-Id'];
    }

  } else if (axiosError.request) {
    // The request was made but no response was received
    // `axiosError.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    // serviceError.ErrorMessage = JSON.stringify(axiosError.request);
    serviceError.ErrorMessage = 'No response';
    serviceError.ComponentErrorCode = 408;
  } else {
    // Something happened in setting up the request that triggered an Error
    // This is a generic error obj
    serviceError.ErrorMessage = axiosError.message;
  }

  serviceError.CorrelationId = (axiosError.config && axiosError.config.headers)
    ? axiosError.config.headers['X-Request-Id']
    : undefined;

  return Promise.reject(serviceError);
};
