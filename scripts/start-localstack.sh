#!/bin/bash

# LocalStack Setup and Test Script

echo "🚀 Starting LocalStack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start LocalStack using docker-compose
echo "📦 Starting LocalStack services..."
docker-compose up -d

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
sleep 10

# Test LocalStack connectivity
echo "🔍 Testing LocalStack connectivity..."
curl -s http://localhost:4566/health || echo "❌ LocalStack not responding"

# Create DynamoDB table
echo "🗄️ Creating DynamoDB table..."
aws dynamodb create-table \
    --table-name local-test-table \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:4566 \
    --region us-east-1

# Create S3 bucket
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://local-test-bucket \
    --endpoint-url http://localhost:4566 \
    --region us-east-1

echo "✅ LocalStack setup complete!"
echo "📋 Available services:"
echo "   - DynamoDB: http://localhost:4566"
echo "   - S3: http://localhost:4566"
echo "   - Health check: http://localhost:4566/health"
echo ""
echo "🔧 To use with your Lambda:"
echo "   export USE_LOCALSTACK=true"
echo "   export AWS_ENDPOINT_URL=http://localhost:4566"
