import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { LambdaServiceProps } from '../interfaces/stack-props';

export class Lambda extends Construct {
    public readonly lambda : lambda.Function;
    constructor(scope:Construct , id :string , props : LambdaServiceProps ){
        super(scope,id);

        this.lambda = new lambda.Function(this,'myLambda' , {
            runtime : lambda.Runtime.NODEJS_18_X,
            handler : 'index.handler' ,
            code : lambda.Code.fromAsset('lib/lambda'), 
            vpc : props.vpc ,
            vpcSubnets :{ subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS},
            environment :{
                TABLE_NAME : props.table.tableName ,
                BUCKET_NAME : props.bucket.bucketName,
                LOG_LEVEL: 'info'
            },
            memorySize: 1024,
            timeout: cdk.Duration.seconds(60),
            tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
            // Enable detailed monitoring
            insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0
        });

        // Grant existing permissions
        props.table.grantReadWriteData(this.lambda);
        props.bucket.grantReadWrite(this.lambda);
        
        // Grant CloudWatch permissions for custom metrics
        this.lambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'cloudwatch:PutMetricData'
            ],
            resources: ['*']
        }));

        // Grant X-Ray permissions
        this.lambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords'
            ],
            resources: ['*']
        }));

        // Grant CloudWatch Logs permissions (for structured logging)
        this.lambda.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            resources: [`arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`]
        }));
    }
}