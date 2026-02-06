module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'Controllers/**/*.js',
    'Services/**/*.js',
    'Middleware/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
