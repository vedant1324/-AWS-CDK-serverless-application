#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DataStack } from '../lib/stacks/data-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const app = new cdk.App();

const nextworkstack = new NetworkStack(app,'networkStack',{
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
})
const dataStack = new DataStack(app,'dataStack',{
  vpc: nextworkstack.vpc,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
})
const apiStack = new ApiStack(app,'myApiStack',{
  vpc: nextworkstack.vpc,
  table: dataStack.db,
  bucket: dataStack.bucket,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
})

// Create monitoring stack
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});

// Connect monitoring to resources
monitoringStack.addLambdaMonitoring('MyApiLambda', apiStack.lambda);
monitoringStack.addApiGatewayMonitoring('MyApi', apiStack.api);

app.synth();