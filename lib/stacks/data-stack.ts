import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DataStackProps } from '../interfaces/stack-props';

export class DataStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly db: dynamoDB.Table
    constructor(scope: Construct, id: string, props: DataStackProps) {
        super(scope, id, props);
        this.bucket = new s3.Bucket(this, 'MyBucket', {
            bucketName: 'my-app-storage-bucket',
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.KMS_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            versioned: true,
        })
        this.db = new dynamoDB.Table(this, 'myDb', {
            tableName: 'my-app-table',
            partitionKey: {
                name: 'id',
                type: dynamoDB.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamoDB.AttributeType.NUMBER
            },
            encryption: dynamoDB.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true
            },
            removalPolicy: cdk.RemovalPolicy.RETAIN
        })
    }
}
