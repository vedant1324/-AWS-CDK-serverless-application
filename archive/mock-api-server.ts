import express from 'express';
import { handler } from '../lib/lambda/enhanced-handler';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Mock Lambda function by converting Express request to API Gateway event
async function expressToLambda(req: express.Request, res: express.Response) {
    // Convert Express request to API Gateway event format
    const event = {
        httpMethod: req.method,
        path: req.path,
        pathParameters: Object.keys(req.params).length > 0 ? req.params : null,
        queryStringParameters: Object.keys(req.query).length > 0 ? req.query : null,
        headers: req.headers,
        body: req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : null,
        requestContext: {
            requestId: `mock-${Date.now()}`,
            stage: 'local',
            httpMethod: req.method,
            path: req.path,
            accountId: '123456789012',
            apiId: 'local-api'
        },
        isBase64Encoded: false,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        stageVariables: null,
        resource: req.route?.path || req.path
    };

    try {
        // Set environment variables for local testing
        process.env.USE_MOCK_AWS = 'true';
        process.env.TABLE_NAME = 'local-test-table';
        process.env.BUCKET_NAME = 'local-test-bucket';
        
        // Create mock context for Lambda handler
        const mockContext = {
            functionName: 'mock-function',
            functionVersion: '1',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
            memoryLimitInMB: '128',
            awsRequestId: `mock-${Date.now()}`,
            logGroupName: '/aws/lambda/mock-function',
            logStreamName: 'mock-stream',
            getRemainingTimeInMillis: () => 30000,
            done: () => {},
            fail: () => {},
            succeed: () => {}
        };
        
        const response = await handler(event, mockContext);
        
        // Convert Lambda response back to Express response
        res.status(response.statusCode);
        
        if (response.headers) {
            Object.entries(response.headers).forEach(([key, value]) => {
                res.header(key, value as string);
            });
        }
        
        if (response.body) {
            try {
                const body = JSON.parse(response.body);
                res.json(body);
            } catch {
                res.send(response.body);
            }
        } else {
            res.end();
        }
    } catch (error) {
        console.error('Error in Lambda handler:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// Route all requests through our Lambda handler
// Define specific routes to avoid path-to-regexp issues
app.get('/health', expressToLambda);
app.get('/users', expressToLambda);
app.post('/users', expressToLambda);
app.get('/users/:id', expressToLambda);
app.get('/files', expressToLambda);
app.post('/files', expressToLambda);
app.get('/files/:fileName', expressToLambda);

// Catch-all route for any other paths
app.use('/', expressToLambda);

app.listen(PORT, () => {
    console.log(`🚀 Mock API Server running at http://localhost:${PORT}`);
    console.log('\n📋 Test these endpoints:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/users`);
    console.log(`   POST http://localhost:${PORT}/users`);
    console.log(`   GET  http://localhost:${PORT}/users/123`);
    console.log(`   GET  http://localhost:${PORT}/anything`);
    console.log('\n💡 Use curl, Postman, or your browser to test!');
    console.log('\nExample curl commands:');
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@test.com"}'`);
});

export default app;
