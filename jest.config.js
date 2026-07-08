// jest.config.js

module.exports = {
    moduleFileExtensions: ['js', 'vue'],
    transform: {
      '^.+\\.js$': 'babel-jest',
      '.*\\.(vue)$': 'vue-jest',
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
    },
    testEnvironment: 'jsdom',
    collectCoverage: true,
    coverageReporters: ['html', 'text-summary'],
  }
  