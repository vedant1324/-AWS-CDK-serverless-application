# LocalStack Setup Script for Windows PowerShell

Write-Host "🚀 Starting LocalStack..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing LocalStack containers
Write-Host "🛑 Stopping existing LocalStack containers..." -ForegroundColor Yellow
docker stop localstack 2>$null
docker rm localstack 2>$null

# Start LocalStack directly with Docker
Write-Host "� Starting LocalStack container..." -ForegroundColor Blue
docker run -d `
    --name localstack `
    -p 4566:4566 `
    -e SERVICES=dynamodb,s3,lambda,apigateway `
    -e DEBUG=1 `
    -e DATA_DIR=/tmp/localstack/data `
    localstack/localstack

# Wait for LocalStack to be ready
Write-Host "⏳ Waiting for LocalStack to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Test LocalStack connectivity
Write-Host "🔍 Testing LocalStack connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4566/health" -TimeoutSec 10
    Write-Host "✅ LocalStack is responding" -ForegroundColor Green
    
    # Show health status
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "� Services status:" -ForegroundColor Cyan
    $healthData.services | Format-Table -AutoSize
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
Write-Host "   Set-Variable -Name 'env:USE_LOCALSTACK' -Value 'true'" -ForegroundColor White
Write-Host "   Set-Variable -Name 'env:AWS_ENDPOINT_URL' -Value 'http://localhost:4566'" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test your Lambda with LocalStack:" -ForegroundColor Cyan
Write-Host "   npm run test-with-localstack" -ForegroundColor White
