export default {
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
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Transform with Babel
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Mock styles and assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js'
  }
};