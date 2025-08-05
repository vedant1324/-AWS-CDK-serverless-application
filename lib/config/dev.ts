export const devConfig = {
  // VPC Configuration
  vpc: {
    cidr: '10.0.0.0/16',
    maxAzs: 2
  },
  
  // Database Configuration
  database: {
    tableName: 'dev-users-table',
    billingMode: 'PAY_PER_REQUEST' as const,
    pointInTimeRecovery: false,
    removalPolicy: 'DESTROY' as const
  },
  
  // Storage Configuration
  storage: {
    bucketName: 'dev-user-files-bucket',
    versioning: false,
    removalPolicy: 'DESTROY' as const
  },
  
  // API Configuration
  api: {
    stageName: 'dev',
    throttleRateLimit: 100,
    throttleBurstLimit: 200,
    tracingEnabled: true
  },
  
  // Lambda Configuration
  lambda: {
    timeout: 30,
    memorySize: 512,
    runtime: 'nodejs18.x' as const,
    logLevel: 'debug',
    tracingConfig: 'Active' as const
  },
  
  // Monitoring Configuration
  monitoring: {
    alertEmail: 'dev-alerts@example.com',
    logRetentionDays: 7,
    metricsEnabled: true,
    dashboardEnabled: true,
    detailedMonitoring: true
  }
};
