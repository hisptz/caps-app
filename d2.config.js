/** @type {import('@dhis2/cli-app-scripts').D2Config} */
const config = {
    type: 'app',
    title: 'CAPS',
    minDHIS2Version: '2.41',
    entryPoints: {
        app: './src/app/App.tsx',
    },
    viteConfigExtensions: './viteConfigExtensions.mts',
}

module.exports = config
