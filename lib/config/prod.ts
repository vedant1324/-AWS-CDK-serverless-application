export const prodConfig = {
  // VPC Configuration
  vpc: {
    cidr: '10.2.0.0/16',
    maxAzs: 3
  },
  
  // Database Configuration
  database: {
    tableName: 'prod-users-table',
    billingMode: 'PAY_PER_REQUEST' as const,
    pointInTimeRecovery: true,
    removalPolicy: 'RETAIN' as const
  },
  
  // Storage Configuration
  storage: {
    bucketName: 'prod-user-files-bucket',
    versioning: true,
    removalPolicy: 'RETAIN' as const
  },
  
  // API Configuration
  api: {
    stageName: 'prod',
    throttleRateLimit: 2000,
    throttleBurstLimit: 5000,
    tracingEnabled: true
  },
  
  // Lambda Configuration
  lambda: {
    timeout: 60,
    memorySize: 1024,
    runtime: 'nodejs18.x' as const,
    logLevel: 'warn',
    tracingConfig: 'Active' as const
  },
  
  // Monitoring Configuration
  monitoring: {
    alertEmail: 'prod-alerts@example.com',
    logRetentionDays: 365,
    metricsEnabled: true,
    dashboardEnabled: true,
    detailedMonitoring: true
  }
};
