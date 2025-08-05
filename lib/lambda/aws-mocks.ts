// Mock AWS services for local testing
export class MockDynamoDB {
    private mockData: Map<string, any> = new Map();

    constructor() {
        // Seed with some mock data
        this.mockData.set('user_1', {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
        });
        this.mockData.set('user_2', {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            createdAt: '2024-01-16T14:20:00Z',
            updatedAt: '2024-01-16T14:20:00Z'
        });
    }

    async putItem(params: any): Promise<any> {
        console.log('🔄 Mock DynamoDB putItem:', params);
        const key = params.Item.id.S || params.Item.id;
        this.mockData.set(key, params.Item);
        
        return {
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async getItem(params: any): Promise<any> {
        console.log('🔍 Mock DynamoDB getItem:', params);
        const key = params.Key.id.S || params.Key.id;
        const item = this.mockData.get(key);
        
        return {
            Item: item || null,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async scan(params: any): Promise<any> {
        console.log('📋 Mock DynamoDB scan:', params);
        const items = Array.from(this.mockData.values());
        
        return {
            Items: items.slice(0, params.Limit || 50),
            Count: items.length,
            ScannedCount: items.length,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async updateItem(params: any): Promise<any> {
        console.log('✏️ Mock DynamoDB updateItem:', params);
        const key = params.Key.id.S || params.Key.id;
        const existingItem = this.mockData.get(key) || {};
        
        // Simple mock update - just merge the update expression
        const updatedItem = {
            ...existingItem,
            updatedAt: new Date().toISOString()
        };
        
        this.mockData.set(key, updatedItem);
        
        return {
            Attributes: updatedItem,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async deleteItem(params: any): Promise<any> {
        console.log('🗑️ Mock DynamoDB deleteItem:', params);
        const key = params.Key.id.S || params.Key.id;
        const deleted = this.mockData.delete(key);
        
        return {
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }
}

export class MockS3 {
    private mockBuckets: Map<string, Map<string, any>> = new Map();

    constructor() {
        // Initialize mock bucket
        this.mockBuckets.set('mock-bucket', new Map());
        
        // Seed with some mock files
        const bucket = this.mockBuckets.get('mock-bucket')!;
        bucket.set('users/profile-1.json', {
            Body: JSON.stringify({ userId: 1, profilePicture: 'https://example.com/pic1.jpg' }),
            ContentType: 'application/json',
            LastModified: new Date('2024-01-15'),
            ContentLength: 85
        });
        bucket.set('documents/readme.txt', {
            Body: 'Welcome to our application!',
            ContentType: 'text/plain',
            LastModified: new Date('2024-01-10'),
            ContentLength: 28
        });
    }

    async putObject(params: any): Promise<any> {
        console.log('📤 Mock S3 putObject:', { 
            Bucket: params.Bucket, 
            Key: params.Key, 
            ContentType: params.ContentType 
        });
        
        const bucketName = params.Bucket;
        if (!this.mockBuckets.has(bucketName)) {
            this.mockBuckets.set(bucketName, new Map());
        }
        
        const bucket = this.mockBuckets.get(bucketName)!;
        bucket.set(params.Key, {
            Body: params.Body,
            ContentType: params.ContentType || 'binary/octet-stream',
            LastModified: new Date(),
            ContentLength: typeof params.Body === 'string' ? params.Body.length : 0
        });
        
        return {
            ETag: `"mock-etag-${Date.now()}"`,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async getObject(params: any): Promise<any> {
        console.log('📥 Mock S3 getObject:', { 
            Bucket: params.Bucket, 
            Key: params.Key 
        });
        
        const bucket = this.mockBuckets.get(params.Bucket);
        if (!bucket) {
            throw new Error(`NoSuchBucket: The specified bucket does not exist: ${params.Bucket}`);
        }
        
        const object = bucket.get(params.Key);
        if (!object) {
            throw new Error(`NoSuchKey: The specified key does not exist: ${params.Key}`);
        }
        
        return {
            ...object,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async listObjectsV2(params: any): Promise<any> {
        console.log('📂 Mock S3 listObjectsV2:', { 
            Bucket: params.Bucket, 
            Prefix: params.Prefix 
        });
        
        const bucket = this.mockBuckets.get(params.Bucket);
        if (!bucket) {
            return {
                Contents: [],
                KeyCount: 0,
                $metadata: {
                    httpStatusCode: 200,
                    requestId: `mock-${Date.now()}`
                }
            };
        }
        
        let objects = Array.from(bucket.entries()).map(([key, value]) => ({
            Key: key,
            LastModified: value.LastModified,
            Size: value.ContentLength,
            StorageClass: 'STANDARD'
        }));
        
        if (params.Prefix) {
            objects = objects.filter(obj => obj.Key.startsWith(params.Prefix));
        }
        
        return {
            Contents: objects.slice(0, params.MaxKeys || 1000),
            KeyCount: objects.length,
            $metadata: {
                httpStatusCode: 200,
                requestId: `mock-${Date.now()}`
            }
        };
    }

    async deleteObject(params: any): Promise<any> {
        console.log('🗑️ Mock S3 deleteObject:', { 
            Bucket: params.Bucket, 
            Key: params.Key 
        });
        
        const bucket = this.mockBuckets.get(params.Bucket);
        if (bucket) {
            bucket.delete(params.Key);
        }
        
        return {
            $metadata: {
                httpStatusCode: 204,
                requestId: `mock-${Date.now()}`
            }
        };
    }
}

// Determine if we should use mock services
export const isLocalEnvironment = () => {
    return process.env.AWS_EXECUTION_ENV === undefined || 
           process.env.NODE_ENV === 'test' ||
           process.env.USE_MOCK_AWS === 'true';
};

// Factory functions to create AWS clients
export const createDynamoDBClient = () => {
    // Check for LocalStack first
    if (process.env.USE_LOCALSTACK === 'true') {
        console.log('🚀 Using LocalStack DynamoDB at http://localhost:4566');
        const AWS = require('aws-sdk');
        return new AWS.DynamoDB.DocumentClient({
            endpoint: 'http://localhost:4566',
            region: 'us-east-1',
            accessKeyId: 'test',
            secretAccessKey: 'test'
        });
    }
    
    if (isLocalEnvironment()) {
        console.log('🔧 Using Mock DynamoDB for local testing');
        return new MockDynamoDB();
    }
    
    // In real AWS environment, return actual DynamoDB client
    const AWS = require('aws-sdk');
    return new AWS.DynamoDB.DocumentClient();
};

export const createS3Client = () => {
    // Check for LocalStack first
    if (process.env.USE_LOCALSTACK === 'true') {
        console.log('🚀 Using LocalStack S3 at http://localhost:4566');
        const AWS = require('aws-sdk');
        return new AWS.S3({
            endpoint: 'http://localhost:4566',
            region: 'us-east-1',
            accessKeyId: 'test',
            secretAccessKey: 'test',
            s3ForcePathStyle: true
        });
    }
    
    if (isLocalEnvironment()) {
        console.log('🔧 Using Mock S3 for local testing');
        return new MockS3();
    }
    
    // In real AWS environment, return actual S3 client
    const AWS = require('aws-sdk');
    return new AWS.S3();
};
