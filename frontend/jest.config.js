module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-bootstrap)/)'
  ],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/fileMock.js',
    '\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};
