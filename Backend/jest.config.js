/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // @stellar/stellar-sdk pulls in a few ESM-only transitive dependencies
  // with no CJS build (Jest's default ignore-all-of-node_modules breaks on
  // their `import`/`export` syntax), so these specifically need to run
  // through the transform instead of being skipped.
  transformIgnorePatterns: ['node_modules/(?!.*(@noble|uint8array-extras))'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
