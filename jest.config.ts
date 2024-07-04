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
  testEnvironment: 'node'
}