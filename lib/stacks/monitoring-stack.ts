import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  alertEmail?: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'monitoring-alerts',
      displayName: 'Application Monitoring Alerts'
    });

    // Add email subscription if email is provided
    if (props.alertEmail) {
      this.alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      dashboardName: 'application-dashboard',
      defaultInterval: cdk.Duration.hours(1)
    });

    // Add basic widgets to dashboard (will be populated by other stacks)
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# Application Monitoring Dashboard

This dashboard provides comprehensive monitoring for the serverless application.

## Key Metrics:
- **Lambda Performance**: Request duration, success/error rates
- **API Gateway**: Request count, latency, 4xx/5xx errors  
- **DynamoDB**: Read/write capacity, throttles, errors
- **S3**: Request metrics, data transfer
- **Custom Metrics**: Business logic metrics

## Alerts:
- High error rates
- Performance degradation
- Resource utilization
`,
        width: 24,
        height: 6
      })
    );

    // Create log group for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/lambda/application`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create custom metric filters for log analysis
    this.createLogMetricFilters(applicationLogGroup);

    // Output important resources
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Topic ARN for monitoring alerts'
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${cdk.Stack.of(this).region}.console.aws.amazon.com/cloudwatch/home?region=${cdk.Stack.of(this).region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL'
    });
  }

  private createLogMetricFilters(logGroup: logs.LogGroup): void {
    // Error count metric filter
    new logs.MetricFilter(this, 'ErrorMetricFilter', {
      logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'error'),
      metricNamespace: 'MyApp/Logs',
      metricName: 'ErrorCount',
      metricValue: '1',
      defaultValue: 0
    });

    // Warning count metric filter
    new logs.MetricFilter(this, 'WarningMetricFilter', {
      logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'warn'),
      metricNamespace: 'MyApp/Logs',
      metricName: 'WarningCount',
      metricValue: '1',
      defaultValue: 0
    });

    // Request duration metric filter
    new logs.MetricFilter(this, 'DurationMetricFilter', {
      logGroup,
      filterPattern: logs.FilterPattern.exists('$.duration'),
      metricNamespace: 'MyApp/Logs',
      metricName: 'RequestDurationFromLogs',
      metricValue: '$.duration',
      defaultValue: 0
    });

    // Database operation count
    new logs.MetricFilter(this, 'DatabaseOperationFilter', {
      logGroup,
      filterPattern: logs.FilterPattern.stringValue('$.message', '=', 'Database operation completed'),
      metricNamespace: 'MyApp/Database',
      metricName: 'OperationCount',
      metricValue: '1',
      defaultValue: 0
    });
  }

  public addLambdaMonitoring(functionName: string, lambda: any): void {
    // Lambda metrics widgets
    const lambdaInvocations = new cloudwatch.GraphWidget({
      title: `${functionName} - Invocations`,
      left: [lambda.metricInvocations()],
      width: 12,
      height: 6
    });

    const lambdaErrors = new cloudwatch.GraphWidget({
      title: `${functionName} - Errors`,
      left: [lambda.metricErrors(), lambda.metricThrottles()],
      width: 12,
      height: 6
    });

    const lambdaDuration = new cloudwatch.GraphWidget({
      title: `${functionName} - Duration`,
      left: [lambda.metricDuration()],
      width: 12,
      height: 6
    });

    // Add Lambda widgets to dashboard
    this.dashboard.addWidgets(
      lambdaInvocations,
      lambdaErrors,
      lambdaDuration
    );

    // Create Lambda alarms
    this.createLambdaAlarms(functionName, lambda);
  }

  public addApiGatewayMonitoring(apiName: string, restApi: any): void {
    // Create simple API Gateway monitoring widget
    const apiWidget = new cloudwatch.GraphWidget({
      title: `${apiName} - Requests`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: apiName
          }
        })
      ],
      width: 12,
      height: 6
    });

    // Add API Gateway widgets to dashboard
    this.dashboard.addWidgets(apiWidget);
  }

  public addDynamoDBMonitoring(tableName: string, table: any): void {
    // Create simple DynamoDB monitoring widget
    const dynamoWidget = new cloudwatch.GraphWidget({
      title: `${tableName} - Operations`,
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ItemCount',
          dimensionsMap: {
            TableName: tableName
          }
        })
      ],
      width: 12,
      height: 6
    });

    // Add DynamoDB widgets to dashboard
    this.dashboard.addWidgets(dynamoWidget);
  }

  private createLambdaAlarms(functionName: string, lambda: any): void {
    // High error rate alarm
    new cloudwatch.Alarm(this, `${functionName}HighErrorRate`, {
      alarmName: `${functionName}-high-error-rate`,
      alarmDescription: `High error rate for ${functionName}`,
      metric: lambda.metricErrors({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // High duration alarm
    new cloudwatch.Alarm(this, `${functionName}HighDuration`, {
      alarmName: `${functionName}-high-duration`,
      alarmDescription: `High duration for ${functionName}`,
      metric: lambda.metricDuration({
        statistic: cloudwatch.Statistic.AVERAGE,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10000, // 10 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Throttle alarm
    new cloudwatch.Alarm(this, `${functionName}Throttles`, {
      alarmName: `${functionName}-throttles`,
      alarmDescription: `Throttles detected for ${functionName}`,
      metric: lambda.metricThrottles({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }

  private createApiGatewayAlarms(apiName: string, restApi: any): void {
    // High 4xx error rate
    new cloudwatch.Alarm(this, `${apiName}High4xxErrors`, {
      alarmName: `${apiName}-high-4xx-errors`,
      alarmDescription: `High 4xx error rate for ${apiName}`,
      metric: restApi.metricClientError({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // High 5xx error rate
    new cloudwatch.Alarm(this, `${apiName}High5xxErrors`, {
      alarmName: `${apiName}-high-5xx-errors`,
      alarmDescription: `High 5xx error rate for ${apiName}`,
      metric: restApi.metricServerError({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // High latency alarm
    new cloudwatch.Alarm(this, `${apiName}HighLatency`, {
      alarmName: `${apiName}-high-latency`,
      alarmDescription: `High latency for ${apiName}`,
      metric: restApi.metricLatency({
        statistic: cloudwatch.Statistic.AVERAGE,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 2000, // 2 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }

  private createDynamoDBAlarms(tableName: string, table: any): void {
    // Read throttle alarm
    new cloudwatch.Alarm(this, `${tableName}ReadThrottles`, {
      alarmName: `${tableName}-read-throttles`,
      alarmDescription: `Read throttles for ${tableName}`,
      metric: table.metricThrottledRequestsForRead({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Write throttle alarm
    new cloudwatch.Alarm(this, `${tableName}WriteThrottles`, {
      alarmName: `${tableName}-write-throttles`,
      alarmDescription: `Write throttles for ${tableName}`,
      metric: table.metricThrottledRequestsForWrite({
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
  }

  public addCustomMetricsWidgets(): void {
    // Custom application metrics
    const customMetrics = new cloudwatch.GraphWidget({
      title: 'Custom Application Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'MyApp/Lambda',
          metricName: 'RequestCount',
          statistic: cloudwatch.Statistic.SUM
        }),
        new cloudwatch.Metric({
          namespace: 'MyApp/Lambda',
          metricName: 'SuccessfulRequests',
          statistic: cloudwatch.Statistic.SUM
        }),
        new cloudwatch.Metric({
          namespace: 'MyApp/Lambda',
          metricName: 'FailedRequests',
          statistic: cloudwatch.Statistic.SUM
        })
      ],
      width: 12,
      height: 6
    });

    const businessMetrics = new cloudwatch.GraphWidget({
      title: 'Business Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'MyApp/Lambda',
          metricName: 'UsersCreated',
          statistic: cloudwatch.Statistic.SUM
        }),
        new cloudwatch.Metric({
          namespace: 'MyApp/Lambda',
          metricName: 'FilesUploaded',
          statistic: cloudwatch.Statistic.SUM
        })
      ],
      width: 12,
      height: 6
    });

    this.dashboard.addWidgets(customMetrics, businessMetrics);
  }
}
