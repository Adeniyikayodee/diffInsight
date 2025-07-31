// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error logging for debugging
  error: jest.fn(),
  // Silence info and debug in tests
  info: jest.fn(),
  debug: jest.fn(),
  // Keep warnings visible
  warn: console.warn,
  // Keep log for debugging
  log: console.log
};