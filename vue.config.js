const glob = require('glob');
const path = require('path');
const fs = require('fs');

const RUNNING_ON_DEV = process.env.VUE_APP_HM_APPLICATION_ENV === 'development';

const httpsOption = () => {
    try {
        return {
            key: fs.readFileSync('/etc/nginx/ssl/cert.key'),
            cert: fs.readFileSync('/etc/nginx/ssl/cert.crt'),
        };
    } catch {
        // Could not find SSL certificates for the webpack-server. Self-signed certificate will be used.
        return true;
    }
};

module.exports = {
    publicPath: process.env.WEBPACK_DEV_SERVER ? '/' : '/spa/',
    outputDir: '../public/spa',
    css: {
        // Enable CSS source maps.
        sourceMap: true,
        loaderOptions: {
            sass: {
                // expose global stylesheets to all modules
                additionalData: '@import "@/styles/global/_index.scss";',
            },
        },
    },
    productionSourceMap: false,
    configureWebpack: {
        devtool: RUNNING_ON_DEV ? 'cheap-module-eval-source-map' : 'source-map',
    },
    chainWebpack: (config) => {
        const mockSchemas = [];

        if (RUNNING_ON_DEV) {
            // Find all mock schemas.
            const schemas = glob.sync('*.schema.gql', {
                cwd: 'src/graphql/mocking/schemas/',
                ignore: ['FullMock.schema.gql'],
                absolute: true,
            });

            // Use mock schema only in development build.
            mockSchemas.push(...schemas);
        }

        config.module
            .rule('graphql-introspection')
            .test(/\.igql$/)
            .use('introspection-loader')
            .loader('./.introspection-loader.js')
            .options({
                schemas: ['./schema.graphql', ...mockSchemas],
            })
            .end();

        // Enable loading of .gql files containing graphql queries
        // that can then be used with apollo.
        config.module
            .rule('graphql')
            .test(/\.gql$/)
            .use('graphql-tag/loader')
            .loader('graphql-tag/loader')
            .end();

        config.entry('main').add('whatwg-fetch').end();
    },
    pluginOptions: {
        webpackBundleAnalyzer: {
            openAnalyzer: false,
            analyzerMode: 'disabled',
        },
    },
    transpileDependencies: ['@rd-internal/rd-vue-gtm'],
    lintOnSave: false,
    devServer: {
        proxy: `https://${process.env.HM_SANDBOX_HOSTNAME}/`,
        host: '0.0.0.0',
        publicPath: `https://${process.env.HM_SANDBOX_HOSTNAME}:8080/`,
        disableHostCheck: true,
        https: httpsOption(),
        watchOptions: {
            poll: true,
            ignored: [
                path.resolve('./node_modules'),
                path.resolve('./tests'),
                path.resolve('./docs'),
            ],
        },
    },
};
