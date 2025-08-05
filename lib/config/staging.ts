export const stagingConfig = {
  // VPC Configuration
  vpc: {
    cidr: '10.1.0.0/16',
    maxAzs: 2
  },
  
  // Database Configuration
  database: {
    tableName: 'staging-users-table',
    billingMode: 'PAY_PER_REQUEST' as const,
    pointInTimeRecovery: true,
    removalPolicy: 'SNAPSHOT' as const
  },
  
  // Storage Configuration
  storage: {
    bucketName: 'staging-user-files-bucket',
    versioning: true,
    removalPolicy: 'RETAIN' as const
  },
  
  // API Configuration
  api: {
    stageName: 'staging',
    throttleRateLimit: 500,
    throttleBurstLimit: 1000,
    tracingEnabled: true
  },
  
  // Lambda Configuration
  lambda: {
    timeout: 60,
    memorySize: 1024,
    runtime: 'nodejs18.x' as const,
    logLevel: 'info',
    tracingConfig: 'Active' as const
  },
  
  // Monitoring Configuration
  monitoring: {
    alertEmail: 'staging-alerts@example.com',
    logRetentionDays: 90,
    metricsEnabled: true,
    dashboardEnabled: true,
    detailedMonitoring: true
  }
};
