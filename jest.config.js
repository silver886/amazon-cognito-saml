/* eslint-disable import/no-commonjs, import/unambiguous */
// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const {pathsToModuleNameMapper} = require('ts-jest');
// eslint-disable-next-line max-len
// eslint-disable-next-line import/extensions, @typescript-eslint/naming-convention, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const {compilerOptions} = require('./tsconfig.json');

module.exports = {
    preset:            'ts-jest',
    moduleNameMapper:  pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>/'}),
    testEnvironment:   'node',
    clearMocks:        true,
    collectCoverage:   true,
    coverageReporters: [
        'json',
        'lcov',
        'clover',
        'cobertura',
        'text',
    ],
    coverageDirectory: 'jest-reports/cobertura',
    testRegex:         [
        `${__dirname}(/src/(.*/)?__tests__/.*|/(test|src)/(.*/)?.*\\.(test|spec))\\.[jt]sx?$`,
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
    ],
    watchPathIgnorePatterns: [
        '/node_modules/',
    ],
    reporters: [
        'default', [
            'jest-junit', {
                outputDirectory: 'jest-reports/junit',
            },
        ],
    ],
    setupFilesAfterEnv: [
        '<rootDir>/jest.setup.ts',
    ],
};
