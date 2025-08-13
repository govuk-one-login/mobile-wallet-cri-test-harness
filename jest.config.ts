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
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  // By default, Jest ignores node_modules when transforming files.
  // This line makes an exception for certain modern packages that ship only ESM
  // so ts-jest will transpile them to CommonJS for Jest to run.
  transformIgnorePatterns: [
    '/node_modules/(?!cbor2|@cto.af/wtf8)'
  ],
  // Use ts-jest preset for mixed JS/TS in ESM mode
  preset: 'ts-jest/presets/js-with-ts-esm',
};
