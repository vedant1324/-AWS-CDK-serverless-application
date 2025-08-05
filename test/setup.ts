// Jest setup file to handle cleanup and prevent memory leaks

// Set test timeout
jest.setTimeout(10000);

// Global cleanup after all tests
afterAll(async () => {
  // Clean up any open handles, timers, etc.
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.resetModules();
});
