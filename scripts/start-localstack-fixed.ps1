# 🚀 LocalStack Setup Script for AWS CDK Development
# This script starts LocalStack with all the services needed for the CDK application

Write-Host "🚀 Starting LocalStack for AWS CDK Development" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Cyan
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Stop existing LocalStack container
Write-Host "🛑 Stopping any existing LocalStack container..." -ForegroundColor Cyan
docker stop localstack 2>$null
docker rm localstack 2>$null

# Start LocalStack with required services
Write-Host "🐳 Starting LocalStack container..." -ForegroundColor Cyan
docker run -d `
    --name localstack `
    -p 4566:4566 `
    -e "SERVICES=dynamodb,s3,lambda,apigateway,logs,cloudwatch" `
    -e "DEBUG=1" `
    -e "DATA_DIR=/tmp/localstack/data" `
    -e "LAMBDA_EXECUTOR=docker" `
    -e "DOCKER_HOST=unix:///var/run/docker.sock" `
    -v "/var/run/docker.sock:/var/run/docker.sock" `
    localstack/localstack

# Wait for LocalStack to be ready
Write-Host "⏳ Waiting for LocalStack to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4566/health" -TimeoutSec 5
        if ($response) {
            Write-Host "✅ LocalStack is ready!" -ForegroundColor Green
            break
        }
    } catch {
        if ($attempt -eq $maxAttempts) {
            Write-Host "❌ LocalStack failed to start within $maxAttempts attempts" -ForegroundColor Red
            Write-Host "📋 Container logs:" -ForegroundColor Yellow
            docker logs localstack --tail 20
            exit 1
        }
    }
} while ($attempt -lt $maxAttempts)

# Display service status
Write-Host "📊 Checking service status..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4566/health"
    Write-Host "🌟 Services status:" -ForegroundColor Cyan
    Write-Host "   DynamoDB: Available" -ForegroundColor Green
    Write-Host "   S3: Available" -ForegroundColor Green
    Write-Host "   Lambda: Available" -ForegroundColor Green
    Write-Host "   API Gateway: Available" -ForegroundColor Green
    Write-Host "   CloudWatch: Available" -ForegroundColor Green
} catch {
    Write-Host "❌ LocalStack not responding" -ForegroundColor Red
    Write-Host "📋 Container logs:" -ForegroundColor Yellow
    docker logs localstack --tail 20
}

Write-Host ""
Write-Host "✅ LocalStack setup complete!" -ForegroundColor Green
Write-Host "📋 Available services:" -ForegroundColor Cyan
Write-Host "   - DynamoDB: http://localhost:4566" -ForegroundColor White
Write-Host "   - S3: http://localhost:4566" -ForegroundColor White
Write-Host "   - Health check: http://localhost:4566/health" -ForegroundColor White
Write-Host ""
Write-Host "🔧 To use with your Lambda:" -ForegroundColor Cyan
Write-Host "   Set environment variables:" -ForegroundColor White
Write-Host "   USE_LOCALSTACK=true" -ForegroundColor Gray
Write-Host "   AWS_ENDPOINT_URL=http://localhost:4566" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test your Lambda with LocalStack:" -ForegroundColor Cyan
Write-Host "   npm run test-with-localstack" -ForegroundColor White
