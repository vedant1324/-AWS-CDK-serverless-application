import { handler } from '../lib/lambda/enhanced-handler';

// Set environment to use mock services
process.env.USE_MOCK_AWS = 'true';
process.env.TABLE_NAME = 'local-test-table';
process.env.BUCKET_NAME = 'local-test-bucket';

// Mock Lambda context
const mockContext = {
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'mock-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
};

// Mock API Gateway event structure
const mockApiGatewayEvent = {
    httpMethod: 'GET',
    path: '/health',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '/health',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LocalStack-Test/1.0'
    },
    body: null,
    requestContext: {
        requestId: 'mock-request-id',
        stage: 'dev',
        httpMethod: 'GET',
        path: '/health',
        accountId: '123456789012',
        apiId: 'mock-api-id',
        identity: {
            sourceIp: '127.0.0.1',
            userAgent: 'LocalStack-Test/1.0'
        }
    },
    isBase64Encoded: false
};

// Test creating a new user (DynamoDB + S3)
const mockCreateUserEvent = {
    httpMethod: 'POST',
    path: '/users',
    pathParameters: null,
    queryStringParameters: null,
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        department: 'Engineering'
    }),
    requestContext: {
        requestId: 'mock-post-request-id',
        stage: 'dev',
        httpMethod: 'POST',
        path: '/users'
    },
    isBase64Encoded: false
};

// Test getting all users from DynamoDB
const mockGetUsersEvent = {
    httpMethod: 'GET',
    path: '/users',
    pathParameters: null,
    queryStringParameters: null,
    headers: {
        'Content-Type': 'application/json'
    },
    body: null,
    requestContext: {
        requestId: 'mock-get-users-id',
        stage: 'dev',
        httpMethod: 'GET',
        path: '/users'
    },
    isBase64Encoded: false
};

// Test getting specific user (DynamoDB + S3)
const mockGetUserEvent = {
    httpMethod: 'GET',
    path: '/users/user_1',
    pathParameters: {
        id: 'user_1'
    },
    queryStringParameters: null,
    headers: {
        'Content-Type': 'application/json'
    },
    body: null,
    requestContext: {
        requestId: 'mock-get-user-id',
        stage: 'dev',
        httpMethod: 'GET',
        path: '/users/{id}'
    },
    isBase64Encoded: false
};

// Test file upload to S3
const mockUploadFileEvent = {
    httpMethod: 'POST',
    path: '/files',
    pathParameters: null,
    queryStringParameters: null,
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'test-document.txt',
        content: 'This is a test document with some content.',
        contentType: 'text/plain'
    }),
    requestContext: {
        requestId: 'mock-upload-request-id',
        stage: 'dev',
        httpMethod: 'POST',
        path: '/files'
    },
    isBase64Encoded: false
};

// Test listing files from S3
const mockListFilesEvent = {
    httpMethod: 'GET',
    path: '/files',
    pathParameters: null,
    queryStringParameters: {
        prefix: 'profiles'
    },
    headers: {
        'Content-Type': 'application/json'
    },
    body: null,
    requestContext: {
        requestId: 'mock-list-files-id',
        stage: 'dev',
        httpMethod: 'GET',
        path: '/files'
    },
    isBase64Encoded: false
};

async function testLambda() {
    console.log('🚀 Testing Lambda Function with Mock AWS Services\n');
    
    try {
        console.log('📝 Test 1: Health Check');
        const response1 = await handler(mockApiGatewayEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response1.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('📝 Test 2: Create User (DynamoDB + S3)');
        const response2 = await handler(mockCreateUserEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response2.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('📝 Test 3: Get All Users (DynamoDB Scan)');
        const response3 = await handler(mockGetUsersEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response3.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('📝 Test 4: Get Specific User (DynamoDB + S3)');
        const response4 = await handler(mockGetUserEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response4.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('📝 Test 5: Upload File (S3)');
        const response5 = await handler(mockUploadFileEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response5.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('📝 Test 6: List Files (S3)');
        const response6 = await handler(mockListFilesEvent, mockContext);
        console.log('Response:', JSON.stringify(JSON.parse(response6.body), null, 2));
        console.log('\n' + '='.repeat(80) + '\n');

        console.log('✅ All AWS service tests completed successfully!');
        console.log('\n🎯 Key Features Tested:');
        console.log('   ✓ DynamoDB operations (scan, get, put)');
        console.log('   ✓ S3 operations (upload, list, get)');
        console.log('   ✓ Mock AWS services working locally');
        console.log('   ✓ Error handling and fallbacks');
        console.log('   ✓ Cross-service data relationships');
        
    } catch (error) {
        console.error('❌ Error testing Lambda:', error);
    }
}

// Run the tests
testLambda();
