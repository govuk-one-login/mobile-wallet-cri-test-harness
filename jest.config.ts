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
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node'
}