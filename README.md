# 🚀 AWS CDK Serverless Application with Enhanced Monitoring

A production-ready serverless application built with AWS CDK v2, featuring comprehensive monitoring, LocalStack integration for development, and enterprise-grade observability.

## 🌟 Features

- **🏗️ Serverless Architecture**: Lambda + API Gateway + DynamoDB + S3
- **📊 Enhanced Monitoring**: CloudWatch dashboards, custom metrics, SNS alerts
- **🧪 Local Development**: Full LocalStack integration with real AWS services
- **🔒 Production Ready**: Structured logging, error handling, performance metrics
- **📝 Type Safety**: Full TypeScript implementation with AWS CDK v2
- **🧪 Testing**: Unit tests + integration tests with real AWS services

## �️ Tech Stack

- **Infrastructure**: AWS CDK v2 (TypeScript)
- **Runtime**: Node.js 18 Lambda functions
- **Database**: DynamoDB with on-demand billing
- **Storage**: S3 with versioning and lifecycle policies
- **Monitoring**: CloudWatch + SNS + Custom dashboards
- **Development**: LocalStack for local AWS services
- **Testing**: Jest + LocalStack integration tests

## 🏗️ Architecture

```
API Gateway → Lambda → DynamoDB
     ↓           ↓         ↓
CloudWatch ← Monitoring ← S3
```

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
│   │   ├── enhanced-handler.ts       # Production Lambda handler with monitoring
│   │   └── aws-mocks.ts              # Mock AWS services for testing
│   └── 📁 interfaces/
│       └── stack-props.ts            # TypeScript interfaces
├── 📁 scripts/
│   ├── test-direct-localstack.js     # LocalStack integration tests
│   └── final-demo.js                 # Comprehensive demo script
├── 📁 test/
│   ├── infrastructure.test.ts        # CDK stack tests
│   └── lambda-handler.test.ts        # Lambda function tests
├── � archive/                       # Archived development files
└── 📄 README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

### Installation
```bash
git clone <repository-url>
cd aws-cdk-serverless-app
npm install
```

### Deployment
```bash
# Deploy to AWS
cdk bootstrap
cdk deploy --all

# Local development with LocalStack
npm run start:localstack
npm test
```

### Testing
```bash
npm test                    # Run all tests
npm run test:integration    # Integration tests with LocalStack
npm run test:watch         # Watch mode for development
```

## 📊 Monitoring & Observability

This application includes comprehensive monitoring with:

- **CloudWatch Dashboards**: Real-time metrics and visualizations
- **SNS Alerts**: Automated notifications for critical events
- **Structured Logging**: Winston-based logging with correlation IDs
- **Performance Metrics**: Custom metrics for application health
- **LocalStack Integration**: Local development and testing environment

Access the monitoring dashboard at `/monitoring/index.html` after deployment.

## 🧪 Testing

- **Unit Tests**: Jest-based testing for Lambda functions and infrastructure
- **Integration Tests**: LocalStack integration for full AWS service testing
- **Mock Services**: Complete AWS service mocking for development

## 📚 Documentation

- `MONITORING_GUIDE.md` - Comprehensive monitoring setup and usage
- `DEVELOPMENT_GUIDE.md` - Development best practices and guidelines
- `AWS_MOCK_TESTING_RESULTS.md` - LocalStack testing results

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation files for detailed guides
- Review the monitoring guide for operational questions

### Single Environment Setup
This application is configured for development and testing with:
- **Purpose**: Development, testing, and production deployments
- **Resources**: Optimal configuration for cost and performance
- **Monitoring**: Comprehensive logging and alerting
- **Cost**: Balanced for development efficiency and production readiness



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