import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb  from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {StackProps } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';

export interface DataStackProps extends StackProps {
    vpc: ec2.IVpc;
}

export interface LambdaServiceProps  {
    vpc : ec2.IVpc,
    table : dynamodb.ITable ,
    bucket : s3.IBucket,
}

export interface ApiGatewayProps extends StackProps {
    vpc : ec2.IVpc,   
    table: dynamodb.ITable,
    bucket: s3.IBucket
}

export interface NetworkStackProps extends StackProps{
    vpc? : IVpc
}