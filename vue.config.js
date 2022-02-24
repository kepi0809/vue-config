const fs = require('fs');

const httpsOption = () => {
    try {
        return {
            key: fs.readFileSync('/etc/nginx/ssl/cert.key'),
            cert: fs.readFileSync('/etc/nginx/ssl/cert.crt'),
        };
    } catch {
        // Could not find SSL certificates for the webpack-server. Self-signed certificate will be used.
        return {};
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
        devtool: RUNNING_ON_DEV ? 'eval-cheap-module-source-map' : 'source-map',
    },
    chainWebpack: (config) => {
        config.module
            .rule('graphql-introspection')
            .test(/\.igql$/)
            .use('introspection-loader')
            .loader('./.introspection-loader.js')
            .options({ schemas: ['./schema.graphql'] })
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
    lintOnSave: false,
    devServer: {
        proxy: `https://${process.env.HM_SANDBOX_HOSTNAME}/`,
        host: '0.0.0.0',
        devMiddleware: { publicPath: `https://${process.env.HM_SANDBOX_HOSTNAME}:8080/` },
        allowedHosts: 'all',
        server: {
            type: 'https',
            options: httpsOption(),
        },
    },
};
