import { handleServiceResponseError } from './handleServiceResponseError';
import { AxiosResponse } from 'axios';
import { ServiceError } from './Error';

describe('handleServiceResponseError', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should reject when response.data.error is undef and config.headers is undef', async () => {
    const error = {
      name: '',
      message: '',
      isAxiosError: true,
      response: {
        data: {
          error: 'something went wrong'
        },
        headers: {},
        status: 500
      } as AxiosResponse,
      config: {}
    };

    expect.assertions(2);

    try {
      await handleServiceResponseError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceError);
      expect(e).toMatchObject({
        ErrorMessage: {
          error: 'something went wrong'
        },
        ComponentErrorCode: 500
      });
    }
  });

  it('should reject when response.data.error is def and config.headers is def', async () => {
    const error = {
      name: '',
      message: '',
      isAxiosError: true,
      response: {
        data: {
          error: 'something went wrong'
        },
        headers: {},
        status: 500
      } as AxiosResponse,
      config: {
        headers: {
          'X-Request-Id': 'refid'
        }
      }
    };

    expect.assertions(2);

    try {
      await handleServiceResponseError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceError);
      expect(e).toMatchObject({
        ErrorMessage: {
          error: 'something went wrong'
        },
        CorrelationId: 'refid',
        ComponentErrorCode: 500
      });
    }
  });

  it('should reject when there is a general error', async () => {
    const error: Error = {
      name: 'Infinity',
      message: 'Generic error message'
    };

    expect.assertions(2);

    try {
      await handleServiceResponseError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceError);
      expect(e).toMatchObject({
        ErrorMessage: 'Generic error message',
        CorrelationId: undefined
      });
    }
  });
});
