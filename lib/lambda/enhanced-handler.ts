import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createDynamoDBClient, createS3Client, isLocalEnvironment } from './aws-mocks';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import winston from 'winston';

// Initialize CloudWatch client (only for real AWS environment)
const cloudWatchClient = !isLocalEnvironment() 
  ? new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' })
  : null;

// Configure structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Custom metrics helper
async function putMetric(metricName: string, value: number, unit: StandardUnit = StandardUnit.Count, dimensions: any[] = []) {
  if (!cloudWatchClient || isLocalEnvironment()) {
    logger.info('Mock metric (would send to CloudWatch)', { metricName, value, unit, dimensions });
    return;
  }

  try {
    await cloudWatchClient.send(new PutMetricDataCommand({
      Namespace: 'MyApp/Lambda',
      MetricData: [{
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: dimensions
      }]
    }));
  } catch (error) {
    logger.error('Failed to put custom metric', { metricName, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = context.awsRequestId;
  
  logger.info('Request started', {
    requestId,
    method: event.httpMethod,
    path: event.path,
    userAgent: event.headers['User-Agent'],
    sourceIp: event.requestContext.identity.sourceIp,
    environment: isLocalEnvironment() ? 'local-mock' : 'aws'
  });

  // Track request count
  await putMetric('RequestCount', 1, StandardUnit.Count, [
    { Name: 'Method', Value: event.httpMethod },
    { Name: 'Path', Value: event.path },
    { Name: 'Environment', Value: isLocalEnvironment() ? 'local' : 'aws' }
  ]);

  try {
    // Initialize AWS clients (mock or real based on environment)
    const dynamodb = createDynamoDBClient();
    const s3 = createS3Client();
    const tableName = process.env.TABLE_NAME || 'mock-table';
    const bucketName = process.env.BUCKET_NAME || 'mock-bucket';
    
    const { httpMethod, path, pathParameters, queryStringParameters, body } = event;
    let result: APIGatewayProxyResult;
    
    // Handle different routes
    switch (path) {
      case '/health':
        result = await handleHealthCheck(dynamodb, s3, tableName, bucketName);
        break;
        
      case '/users':
        if (httpMethod === 'GET') {
          result = await getUsers(dynamodb, tableName);
        } else if (httpMethod === 'POST') {
          result = await createUser(dynamodb, tableName, body);
        } else {
          result = methodNotAllowed(httpMethod, path);
        }
        break;
        
      case '/files':
        if (httpMethod === 'GET') {
          result = await listFiles(s3, bucketName);
        } else if (httpMethod === 'POST') {
          result = await uploadFile(s3, bucketName, body);
        } else {
          result = methodNotAllowed(httpMethod, path);
        }
        break;
        
      default:
        if (pathParameters?.userId && path.startsWith('/users/')) {
          if (httpMethod === 'GET') {
            result = await getUser(dynamodb, tableName, pathParameters.userId);
          } else if (httpMethod === 'PUT') {
            result = await updateUser(dynamodb, tableName, pathParameters.userId, body);
          } else if (httpMethod === 'DELETE') {
            result = await deleteUser(dynamodb, tableName, pathParameters.userId);
          } else {
            result = methodNotAllowed(httpMethod, path);
          }
        } else {
          result = {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              error: 'Route not found',
              path: path,
              method: httpMethod
            })
          };
        }
        break;
    }

    // Track successful requests
    const duration = Date.now() - startTime;
    await putMetric('RequestDuration', duration, StandardUnit.Milliseconds);
    await putMetric('SuccessfulRequests', 1);

    logger.info('Request completed successfully', {
      requestId,
      statusCode: result.statusCode,
      duration: `${duration}ms`
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Track failed requests
    await putMetric('FailedRequests', 1);
    await putMetric('RequestDuration', duration, StandardUnit.Milliseconds);

    logger.error('Request failed', {
      requestId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
        requestId
      }),
    };
  }
};

async function handleHealthCheck(dynamodb: any, s3: any, tableName: string, bucketName: string): Promise<APIGatewayProxyResult> {
  logger.info('Health check requested');
  
  // Test database connectivity
  let dbHealth = 'unknown';
  try {
    await dynamodb.scan({
      TableName: tableName,
      Limit: 1
    });
    dbHealth = 'healthy';
  } catch (error) {
    dbHealth = 'unhealthy';
    logger.warn('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  // Test S3 connectivity
  let s3Health = 'unknown';
  try {
    await s3.listObjectsV2({
      Bucket: bucketName,
      MaxKeys: 1
    });
    s3Health = 'healthy';
  } catch (error) {
    s3Health = 'unhealthy';
    logger.warn('S3 health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  const healthStatus = {
    status: (dbHealth === 'healthy' && s3Health === 'healthy') ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: isLocalEnvironment() ? 'local-mock' : 'aws',
    region: process.env.AWS_REGION || 'us-east-1',
    checks: {
      database: { status: dbHealth, service: tableName },
      storage: { status: s3Health, service: bucketName }
    }
  };

  await putMetric('HealthCheckRequests', 1);
  await putMetric('ServiceHealth', healthStatus.status === 'healthy' ? 1 : 0);
  
  return {
    statusCode: healthStatus.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(healthStatus),
  };
}

async function getUsers(dynamodb: any, tableName: string): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamodb.scan({
      TableName: tableName
    });
    
    await putMetric('DatabaseOperations', 1, StandardUnit.Count, [{ Name: 'Operation', Value: 'Scan' }]);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        users: result.Items || [],
        count: result.Count || 0,
        scannedCount: result.ScannedCount || 0
      })
    };
  } catch (error) {
    await putMetric('DatabaseErrors', 1, StandardUnit.Count, [{ Name: 'Operation', Value: 'Scan' }]);
    throw error;
  }
}

async function createUser(dynamodb: any, tableName: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const userData = JSON.parse(body);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const user = {
      id: { S: userId },
      name: { S: userData.name || 'Unknown' },
      email: { S: userData.email || '' },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() }
    };

    await dynamodb.putItem({
      TableName: tableName,
      Item: user
    });

    await putMetric('DatabaseOperations', 1, 'Count', [{ Name: 'Operation', Value: 'PutItem' }]);
    await putMetric('UsersCreated', 1);
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User created successfully',
        user: {
          id: userId,
          name: userData.name,
          email: userData.email
        }
      })
    };
  } catch (error) {
    await putMetric('DatabaseErrors', 1, 'Count', [{ Name: 'Operation', Value: 'PutItem' }]);
    throw error;
  }
}

async function getUser(dynamodb: any, tableName: string, userId: string): Promise<APIGatewayProxyResult> {
  try {
    const result = await dynamodb.getItem({
      TableName: tableName,
      Key: {
        id: { S: userId }
      }
    });

    await putMetric('DatabaseOperations', 1, 'Count', [{ Name: 'Operation', Value: 'GetItem' }]);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        user: {
          id: result.Item.id.S,
          name: result.Item.name.S,
          email: result.Item.email.S,
          createdAt: result.Item.createdAt.S,
          updatedAt: result.Item.updatedAt.S
        }
      })
    };
  } catch (error) {
    await putMetric('DatabaseErrors', 1, 'Count', [{ Name: 'Operation', Value: 'GetItem' }]);
    throw error;
  }
}

async function updateUser(dynamodb: any, tableName: string, userId: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const updates = JSON.parse(body);
    const updateExpression = [];
    const expressionAttributeValues: any = {};

    if (updates.name) {
      updateExpression.push('name = :name');
      expressionAttributeValues[':name'] = { S: updates.name };
    }

    if (updates.email) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = { S: updates.email };
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = { S: new Date().toISOString() };

    await dynamodb.updateItem({
      TableName: tableName,
      Key: { id: { S: userId } },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues
    });

    await putMetric('DatabaseOperations', 1, 'Count', [{ Name: 'Operation', Value: 'UpdateItem' }]);
    await putMetric('UsersUpdated', 1);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User updated successfully',
        userId
      })
    };
  } catch (error) {
    await putMetric('DatabaseErrors', 1, 'Count', [{ Name: 'Operation', Value: 'UpdateItem' }]);
    throw error;
  }
}

async function deleteUser(dynamodb: any, tableName: string, userId: string): Promise<APIGatewayProxyResult> {
  try {
    await dynamodb.deleteItem({
      TableName: tableName,
      Key: { id: { S: userId } }
    });

    await putMetric('DatabaseOperations', 1, 'Count', [{ Name: 'Operation', Value: 'DeleteItem' }]);
    await putMetric('UsersDeleted', 1);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User deleted successfully',
        userId
      })
    };
  } catch (error) {
    await putMetric('DatabaseErrors', 1, 'Count', [{ Name: 'Operation', Value: 'DeleteItem' }]);
    throw error;
  }
}

async function listFiles(s3: any, bucketName: string): Promise<APIGatewayProxyResult> {
  try {
    const result = await s3.listObjectsV2({
      Bucket: bucketName
    });

    await putMetric('S3Operations', 1, 'Count', [{ Name: 'Operation', Value: 'ListObjects' }]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        files: result.Contents || [],
        count: result.KeyCount || 0
      })
    };
  } catch (error) {
    await putMetric('S3Errors', 1, 'Count', [{ Name: 'Operation', Value: 'ListObjects' }]);
    throw error;
  }
}

async function uploadFile(s3: any, bucketName: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const fileData = JSON.parse(body);
    const fileName = fileData.fileName || `file-${Date.now()}.txt`;
    const content = fileData.content || 'Default content';

    await s3.putObject({
      Bucket: bucketName,
      Key: fileName,
      Body: content,
      ContentType: fileData.contentType || 'text/plain'
    });

    await putMetric('S3Operations', 1, 'Count', [{ Name: 'Operation', Value: 'PutObject' }]);
    await putMetric('FilesUploaded', 1);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileName,
        bucket: bucketName
      })
    };
  } catch (error) {
    await putMetric('S3Errors', 1, 'Count', [{ Name: 'Operation', Value: 'PutObject' }]);
    throw error;
  }
}

function methodNotAllowed(method: string, path: string): APIGatewayProxyResult {
  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: 'Method not allowed',
      method,
      path
    })
  };
}
