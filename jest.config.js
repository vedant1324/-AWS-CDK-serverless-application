module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
