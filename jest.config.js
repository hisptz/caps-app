const path = require('path')
const defaults = require(
    path.join(
        __dirname,
        'node_modules/@dhis2/cli-app-scripts/config/jest.config.js'
    )
)

module.exports = {
    ...defaults,
    moduleNameMapper: {
        ...defaults.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFiles: ['<rootDir>/src/setupTests.js'],
}
