export default {
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest'
    ],
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'results', outputName: 'report.xml' }]
  ],
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'test/**',
    'src/**',
  ],
  "coveragePathIgnorePatterns": [
    "<rootDir>/test/index.test.ts"
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
}