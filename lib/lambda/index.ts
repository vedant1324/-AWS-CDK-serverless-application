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

export const handler = async (event: any, context?: any): Promise<any> => {
    const startTime = Date.now();
    const requestId = context?.awsRequestId || 'local-request';
    
    logger.info('Request started', {
        requestId,
        method: event.httpMethod,
        path: event.path,
        userAgent: event.headers?.['User-Agent'],
        environment: isLocalEnvironment() ? 'local-mock' : 'aws'
    });

    // Track request count
    await putMetric('RequestCount', 1, StandardUnit.Count, [
        { Name: 'Method', Value: event.httpMethod || 'UNKNOWN' },
        { Name: 'Path', Value: event.path || 'UNKNOWN' },
        { Name: 'Environment', Value: isLocalEnvironment() ? 'local' : 'aws' }
    ]);

    try {
        // Initialize AWS clients (mock or real based on environment)
        const dynamodb = createDynamoDBClient();
        const s3 = createS3Client();
        const tableName = process.env.TABLE_NAME || 'mock-table';
        const bucketName = process.env.BUCKET_NAME || 'mock-bucket';
        
        const { httpMethod, path, pathParameters, queryStringParameters, body } = event;
        
        // Handle different routes
        switch (path) {
            case '/health':
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        environment: isLocalEnvironment() ? 'local-mock' : 'aws',
                        services: {
                            dynamodb: tableName,
                            s3: bucketName
                        }
                    })
                };
                
            case '/users':
                if (httpMethod === 'GET') {
                    // Get all users from DynamoDB
                    try {
                        const result = await dynamodb.scan({
                            TableName: tableName
                        });
                        
                        return {
                            statusCode: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                users: result.Items || [],
                                total: result.Count || 0,
                                source: 'dynamodb'
                            })
                        };
                    } catch (error) {
                        console.error('DynamoDB scan error:', error);
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'Failed to fetch users',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            })
                        };
                    }
                } else if (httpMethod === 'POST') {
                    // Create new user in DynamoDB and profile in S3
                    try {
                        const userData = body ? JSON.parse(body) : {};
                        const userId = `user_${Date.now()}`;
                        const user = {
                            id: userId,
                            ...userData,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        
                        // Save user to DynamoDB
                        await dynamodb.putItem({
                            TableName: tableName,
                            Item: user
                        });
                        
                        // Save user profile to S3
                        const profileData = {
                            userId: userId,
                            profileCreated: new Date().toISOString(),
                            preferences: {
                                theme: 'light',
                                notifications: true
                            }
                        };
                        
                        await s3.putObject({
                            Bucket: bucketName,
                            Key: `profiles/${userId}.json`,
                            Body: JSON.stringify(profileData),
                            ContentType: 'application/json'
                        });
                        
                        return {
                            statusCode: 201,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                message: 'User created successfully',
                                user: user,
                                profileLocation: `s3://${bucketName}/profiles/${userId}.json`
                            })
                        };
                    } catch (error) {
                        console.error('Error creating user:', error);
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'Failed to create user',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            })
                        };
                    }
                }
                break;
                
            case '/files':
                if (httpMethod === 'GET') {
                    // List files in S3
                    try {
                        const prefix = queryStringParameters?.prefix || '';
                        const result = await s3.listObjectsV2({
                            Bucket: bucketName,
                            Prefix: prefix,
                            MaxKeys: 50
                        });
                        
                        return {
                            statusCode: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                files: result.Contents || [],
                                bucket: bucketName,
                                prefix: prefix,
                                count: result.KeyCount || 0
                            })
                        };
                    } catch (error) {
                        console.error('S3 list error:', error);
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'Failed to list files',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            })
                        };
                    }
                } else if (httpMethod === 'POST') {
                    // Upload file to S3
                    try {
                        const fileData = body ? JSON.parse(body) : {};
                        const fileName = fileData.name || `file_${Date.now()}.txt`;
                        const fileContent = fileData.content || 'Default file content';
                        
                        await s3.putObject({
                            Bucket: bucketName,
                            Key: `uploads/${fileName}`,
                            Body: fileContent,
                            ContentType: fileData.contentType || 'text/plain'
                        });
                        
                        return {
                            statusCode: 201,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                message: 'File uploaded successfully',
                                location: `s3://${bucketName}/uploads/${fileName}`,
                                fileName: fileName
                            })
                        };
                    } catch (error) {
                        console.error('S3 upload error:', error);
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'Failed to upload file',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            })
                        };
                    }
                }
                break;
                
            default:
                if (path?.startsWith('/users/') && pathParameters?.id) {
                    // Get specific user from DynamoDB and their profile from S3
                    try {
                        const userId = pathParameters.id;
                        
                        // Get user from DynamoDB
                        const userResult = await dynamodb.getItem({
                            TableName: tableName,
                            Key: { id: userId }
                        });
                        
                        if (!userResult.Item) {
                            return {
                                statusCode: 404,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                body: JSON.stringify({
                                    error: 'User not found',
                                    userId: userId
                                })
                            };
                        }
                        
                        // Try to get user profile from S3
                        let profile = null;
                        try {
                            const profileResult = await s3.getObject({
                                Bucket: bucketName,
                                Key: `profiles/${userId}.json`
                            });
                            profile = JSON.parse(profileResult.Body);
                        } catch (s3Error) {
                            console.log('Profile not found in S3, using default');
                            profile = { message: 'No profile found' };
                        }
                        
                        return {
                            statusCode: 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                user: userResult.Item,
                                profile: profile,
                                lastAccessed: new Date().toISOString()
                            })
                        };
                    } catch (error) {
                        console.error('Error getting user:', error);
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'Failed to get user',
                                message: error instanceof Error ? error.message : 'Unknown error'
                            })
                        };
                    }
                } else if (path?.startsWith('/files/') && pathParameters?.fileName) {
                    // Get specific file from S3
                    try {
                        const fileName = pathParameters.fileName;
                        const folder = queryStringParameters?.folder || 'uploads';
                        
                        const result = await s3.getObject({
                            Bucket: bucketName,
                            Key: `${folder}/${fileName}`
                        });
                        
                        return {
                            statusCode: 200,
                            headers: {
                                'Content-Type': result.ContentType || 'application/octet-stream',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: result.Body
                        };
                    } catch (error) {
                        console.error('File not found:', error);
                        return {
                            statusCode: 404,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            body: JSON.stringify({
                                error: 'File not found',
                                fileName: pathParameters.fileName
                            })
                        };
                    }
                }
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        message: 'Hello from Lambda!',
                        path: path,
                        method: httpMethod,
                        queryParams: queryStringParameters,
                        environment: {
                            TABLE_NAME: tableName,
                            BUCKET_NAME: bucketName,
                            IS_LOCAL: isLocalEnvironment()
                        },
                        timestamp: new Date().toISOString()
                    })
                };
        }
        
        // Track successful requests
        const duration = Date.now() - startTime;
        await putMetric('RequestDuration', duration, StandardUnit.Milliseconds);
        await putMetric('SuccessfulRequests', 1);

        logger.info('Request completed successfully', {
            requestId,
            statusCode: 200,
            duration: `${duration}ms`
        });

        // Default fallback return (should never reach here)
        return {
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
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: errorMessage,
                requestId
            })
        };
    }
};