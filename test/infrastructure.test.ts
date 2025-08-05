import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DataStack } from '../lib/stacks/data-stack';
import { ApiStack } from '../lib/stacks/api-stack';

describe('Infrastructure Stacks', () => {
  let app: App;
  let networkStack: NetworkStack;
  let dataStack: DataStack;
  let apiStack: ApiStack;

  beforeEach(() => {
    app = new App();
    networkStack = new NetworkStack(app, 'TestNetwork', {});
    dataStack = new DataStack(app, 'TestData', {
      vpc: networkStack.vpc
    });
    apiStack = new ApiStack(app, 'TestApi', {
      vpc: networkStack.vpc,
      table: dataStack.db,
      bucket: dataStack.bucket
    });
  });

  afterEach(() => {
    // Clean up to prevent memory leaks
    jest.clearAllMocks();
  });

  test('NetworkStack creates VPC with correct CIDR', () => {
    const template = Template.fromStack(networkStack);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });
  });

  test('DataStack creates DynamoDB table', () => {
    const template = Template.fromStack(dataStack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'my-app-table'
    });
  });

  test('DataStack creates S3 bucket', () => {
    const template = Template.fromStack(dataStack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'my-app-storage-bucket'
    });
  });

  test('ApiStack creates Lambda function', () => {
    const template = Template.fromStack(apiStack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x'
    });
  });

  test('ApiStack creates API Gateway', () => {
    const template = Template.fromStack(apiStack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {});
  });
});
