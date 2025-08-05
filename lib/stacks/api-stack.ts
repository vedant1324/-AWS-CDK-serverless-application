import * as cdk from 'aws-cdk-lib';

import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ApiGatewayProps } from '../interfaces/stack-props';
import { Lambda } from '../constructs/lambda-service';
export class ApiStack extends cdk.Stack{
    public readonly api: apigateway.LambdaRestApi;
    public readonly lambda: any; // Expose lambda for monitoring
    private readonly lambdaService: Lambda;
    constructor(scope : Construct , id : string , props : ApiGatewayProps ){
        super(scope,id,props);
        this.lambdaService = new Lambda(this,'myLambda',{
            vpc : props.vpc,
            table:props.table,
            bucket:props.bucket
        });
        this.lambda = this.lambdaService.lambda; // Expose for monitoring
        this.api = new apigateway.LambdaRestApi(this,'myApiGateway' ,{
            handler : this.lambdaService.lambda,
            deployOptions: {
                stageName: 'dev',
                tracingEnabled: true
            }
        });
      
    }
}