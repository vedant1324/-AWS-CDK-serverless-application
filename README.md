# 🚀 AWS CDK Serverless Application with Enhanced Monitoring

A production-ready serverless application built with AWS CDK, featuring comprehensive monitoring, structured logging, and local testing capabilities.

## 🌟 Features Overview

### 🏗️ **Core Infrastructure**
- **VPC**: Secure network isolation with public/private subnets across multiple AZs
- **API Gateway**: RESTful API with throttling, tracing, and optimized configuration
- **Lambda Functions**: High-performance serverless compute with X-Ray tracing and monitoring
- **DynamoDB**: NoSQL database with on-demand billing and point-in-time recovery
- **S3**: Object storage with encryption, versioning, and lifecycle policies

### 📊 **Enhanced Monitoring & Observability**
- **Structured Logging**: Winston-based JSON logging with correlation IDs
- **Custom CloudWatch Metrics**: Business KPIs and technical performance metrics
- **Real-time Dashboards**: CloudWatch dashboards with Lambda, API Gateway, and DynamoDB metrics
- **Automated Alerts**: SNS-based alerting for errors, performance issues, and throttling
- **X-Ray Tracing**: Distributed tracing for performance insights and bottleneck identification
- **Log Metric Filters**: Automatic extraction of metrics from application logs

### 🧪 **Testing & Local Development**
- **Mock AWS Services**: Local testing without AWS costs
- **LocalStack Integration**: Full AWS service emulation for integration testing
- **Unit Tests**: Jest-based infrastructure and Lambda function testing
- **Mock API Server**: Express-based mock server for frontend development

### 🔒 **Security & Best Practices**
- **IAM Least Privilege**: Minimal required permissions for each service
- **VPC Security**: Private subnets for sensitive resources
- **Encryption**: KMS encryption for S3 and DynamoDB
- **Environment Variable Management**: Secure configuration management

## 📁 Project Structure

```
aws-cdk/
├── 📁 bin/
│   └── aws-cdk.ts                    # Application entry point
├── 📁 lib/
│   ├── 📁 stacks/
│   │   ├── network-stack.ts          # VPC and networking resources
│   │   ├── data-stack.ts             # DynamoDB and S3 resources
│   │   ├── api-stack.ts              # API Gateway and Lambda integration
│   │   └── monitoring-stack.ts       # CloudWatch dashboards and alerts
│   ├── 📁 constructs/
│   │   ├── lambda-service.ts         # Enhanced Lambda construct
│   │   └── api-gateway.ts            # API Gateway construct
│   ├── 📁 lambda/
│   │   ├── index.ts                  # Main Lambda handler with monitoring
│   │   ├── aws-mocks.ts              # Mock AWS services for testing
│   │   └── enhanced-handler.ts       # Advanced handler implementation
│   └── 📁 interfaces/
│       └── stack-props.ts            # TypeScript interfaces
├── 📁 scripts/
│   ├── mock-api-server.js            # Local development server
│   ├── test-lambda-locally.js        # Local Lambda testing
│   └── start-localstack.ps1          # LocalStack setup script
├── 📁 test/
│   ├── infrastructure.test.ts        # CDK stack tests
│   └── lambda-handler.test.ts        # Lambda function tests
├── 📄 MONITORING_GUIDE.md            # Comprehensive monitoring guide
└── 📄 README.md                      # This file
```

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Docker (for LocalStack)
- AWS CDK CLI (`npm install -g aws-cdk`)

### 1. Installation
```bash
# Clone and install dependencies
git clone <your-repo>
cd aws-cdk
npm install

# Build the project
npm run build
```

### 2. Local Development & Testing
```bash
# Test Lambda functions locally with mocks
npm run test-local

# Start LocalStack for AWS service emulation
npm run start-localstack

# Test with LocalStack
npm run test-with-localstack

# Start mock API server for frontend development
npm run start-api
```

### 3. Deployment

#### Deploy to AWS
```bash
# Build the project
npm run build

# Generate CloudFormation templates
npm run synth

# Compare changes before deployment
npm run diff

# Deploy all stacks
npm run deploy

# Monitor your application
npm run monitor
```

#### LocalStack Development & Monitoring
```bash
# Start LocalStack services
npm run start-localstack

# Test with LocalStack
npm run test-with-localstack

# Monitor LocalStack (Web Dashboard) - ⚠️ DEVELOPMENT FEATURE (🚨Limited - Basic service health only)
npm run open-localstack-monitor # ⚠️ 
# Note: This opens a basic monitoring dashboard at localhost:3001
# Status: Basic service health checking - Limited functionality
# Integration: Dashboard exists but service testing needs implementation
# Opens dashboard showing:
# - LocalStack running status ✅
# - Available services (S3, DynamoDB, Lambda) ✅  
# - Basic health checks ✅
# - Activity logs ✅

# Monitor LocalStack (Server Only) - For debugging
npm run monitor-localstack
# Note: Starts monitoring server without opening browser

# Stop LocalStack
npm run stop-localstack
```

#### Destroy Resources
```bash
# Remove all AWS resources
npm run destroy
```

## 📊 Monitoring & Observability

### CloudWatch Dashboards
Your application gets a comprehensive dashboard with:
- **Lambda Performance**: Invocations, errors, duration, memory usage
- **API Gateway Metrics**: Request count, latency, 4xx/5xx errors
- **DynamoDB Monitoring**: Read/write operations, capacity utilization
- **Custom Business Metrics**: User registrations, file uploads, feature usage
- **Application Health**: Service connectivity and performance trends

### Automated Alerts
- **Critical Alerts**: Immediate response required (Lambda errors, API 5xx errors)
- **Warning Alerts**: Performance degradation (high latency, memory usage)
- **Business Alerts**: Usage pattern changes (traffic spikes, error rate increases)

### Structured Logging
Every request includes:
```json
{
  "timestamp": "2025-07-31T08:59:41.604Z",
  "level": "info",
  "message": "Request started",
  "requestId": "abc123-def456",
  "method": "GET",
  "path": "/users",
  "userAgent": "Mozilla/5.0...",
  "sourceIp": "203.0.113.1",
  "environment": "dev"
}
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests with LocalStack
```bash
# Start LocalStack
npm run start-localstack

# Run integration tests
npm run test-with-localstack
```

### Local Development
```bash
# Test Lambda functions with mock services
npm run test-local

# Start development API server
npm run start-api
```

## 🌍 Configuration

### Single Environment Setup
This application is configured for development and testing with:
- **Purpose**: Development, testing, and production deployments
- **Resources**: Optimal configuration for cost and performance
- **Monitoring**: Comprehensive logging and alerting
- **Cost**: Balanced for development efficiency and production readiness

## 📈 Key Metrics Tracked

### Technical Metrics
- **Request Duration**: API response time trends
- **Error Rates**: Success/failure percentages
- **Throughput**: Requests per second
- **Resource Utilization**: Lambda memory, DynamoDB capacity
- **Service Health**: Connectivity and availability

### Business Metrics
- **User Activity**: Registration and engagement rates
- **Feature Usage**: Endpoint popularity and adoption
- **Data Growth**: Storage usage and growth patterns
- **Performance Impact**: Business metrics correlation with technical performance

## 🔧 Available NPM Scripts

```bash
# Development
npm run build              # Compile TypeScript
npm run watch              # Watch mode compilation
npm run test               # Run unit tests

# Local Testing
npm run test-local         # Test Lambda with mocks
npm run test-with-localstack # Test with LocalStack
npm run start-api          # Start mock API server

# LocalStack Management
npm run start-localstack   # Start LocalStack services
npm run stop-localstack    # Stop LocalStack services
npm run open-localstack-monitor # Open LocalStack web dashboard
npm run monitor-localstack # Start monitoring server only

# Deployment
npm run deploy             # Deploy to AWS
npm run destroy            # Destroy AWS resources
npm run diff               # Compare changes
npm run synth              # Generate CloudFormation templates

# Monitoring
npm run monitor            # Open AWS CloudWatch dashboard
```

## 🛠️ API Endpoints

### Health Check
```
GET /health
```
Returns service health status and connectivity checks.

### User Management
```
GET    /users              # List all users
POST   /users              # Create new user
GET    /users/{id}          # Get specific user
PUT    /users/{id}          # Update user
DELETE /users/{id}          # Delete user
```

### File Management
```
GET    /files              # List files
POST   /files              # Upload file
GET    /files/{key}         # Download file
```

## 📚 Additional Documentation

- **[Monitoring Guide](./MONITORING_GUIDE.md)**: Comprehensive monitoring setup and best practices
- **[Development Guide](./DEVELOPMENT_GUIDE.md)**: Local development and testing procedures
- **[LocalStack Setup](./LOCALSTACK_SETUP_COMPLETE.md)**: Complete LocalStack configuration guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run tests (`npm test`)
5. Test locally (`npm run test-local`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Monitoring**: Use `npm run monitor` to access dashboard
- **Local Testing**: Use LocalStack for AWS service emulation

---

**🎯 Production-Ready**: This application follows AWS best practices for security, monitoring, and scalability, ready for development and production deployment. 