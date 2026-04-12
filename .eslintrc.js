module.exports = {
  env: { node: true, jest: true, es2022: true },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-process-exit': 'error',
    'require-await': 'warn',
  },
};
