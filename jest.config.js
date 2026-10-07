const path = require('path')
const defaults = require(
    path.join(
        __dirname,
        'node_modules/@dhis2/cli-app-scripts/config/jest.config.js'
    )
)

const esmPackages = [
    'moment/dist',
    'echarts',
    'zrender',
    'usehooks-ts',
    'lodash-es',
]

module.exports = {
    ...defaults,
    transformIgnorePatterns: [
        `/node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?(${esmPackages.join('|')})/)`,
    ],
    moduleNameMapper: {
        ...defaults.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
        '^jodit-react$': '<rootDir>/jest/joditReactStub.js',
    },
    setupFiles: ['<rootDir>/src/setupTests.js'],
}
