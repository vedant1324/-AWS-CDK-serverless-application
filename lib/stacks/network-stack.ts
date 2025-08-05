import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { NetworkStackProps } from '../interfaces/stack-props';

export class NetworkStack extends cdk.Stack {
    public readonly vpc : ec2.Vpc;
    constructor(scope: Construct, id: string, props: NetworkStackProps) {
        super(scope, id, props);
        
        this.vpc = new ec2.Vpc(this, "myVpc", {
            ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
            maxAzs: 2,
            natGateways: 1,
            subnetConfiguration: [{
                cidrMask: 24,
                name: 'public-subnet',
                subnetType: ec2.SubnetType.PUBLIC
            },
            {
                cidrMask: 25,
                name: 'private-subnet',
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            }
            ]
        })
    }
}