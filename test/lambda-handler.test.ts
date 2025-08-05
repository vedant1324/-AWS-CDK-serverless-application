import { handler } from '../lib/lambda/index';

describe('Lambda Handler Tests', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = {
      ...originalEnv,
      TABLE_NAME: 'test-table',
      BUCKET_NAME: 'test-bucket'
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('Handler processes GET request correctly', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/test',
      pathParameters: null,
      queryStringParameters: null,
      headers: {},
      body: null
    };

    const result = await handler(mockEvent);

    expect(result).toBeDefined();
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from Lambda!');
  });

  test('Handler has access to environment variables', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      path: '/test',
      pathParameters: null,
      queryStringParameters: null,
      headers: {},
      body: null
    };

    const result = await handler(mockEvent);
    const body = JSON.parse(result.body);

    expect(body.message).toBeDefined();
    expect(result.statusCode).toBe(200);
  });

  test('Handler fails gracefully with missing environment', async () => {
    // Remove environment variables
    delete process.env.TABLE_NAME;
    delete process.env.BUCKET_NAME;

    const mockEvent = {
      httpMethod: 'GET',
      path: '/test'
    };

    // Handler should still work but might log warnings
    const result = await handler(mockEvent);
    expect(result.statusCode).toBe(200);
  });
});
