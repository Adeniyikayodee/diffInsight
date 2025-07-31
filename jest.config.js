export default {
  // Use ESM modules
  type: 'module',
  
  // Test environment
  testEnvironment: 'node',
  
  // File patterns
  testMatch: [
    '**/src/**/__tests__/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform ESM imports
  transform: {},
  
  // Handle ESM modules
  extensionsToTreatAsEsm: ['.js'],
  
  // Mock styles and assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js'
  }
};