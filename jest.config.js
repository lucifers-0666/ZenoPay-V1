module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'Middleware/rbacMiddleware.js',
    'Services/generateQR.js',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/scripts/', '/public/'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  globalSetup: '<rootDir>/tests/setup.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
