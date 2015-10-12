var webpack = require('karma-webpack');

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai', 'sinon'],
        files: [
            'karma.entry.js',
        ],
        plugins: [
            webpack,
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-chrome-launcher',
            'karma-coverage',
            'karma-spec-reporter',
            'karma-sourcemap-loader',
        ],
        browsers: ['Chrome'],
        preprocessors: {
            'karma.entry.js' : ['webpack', 'sourcemap'],
        },
        reporters: ['coverage', 'spec'],
        coverageReporter: {
            reporters: [
                { type: 'text' },
            ],
            instrumenterOptions: {
                istanbul: { noCompact: true }
            }
        },
        webpack: {
            devtool: 'inline-source-map',
            module: {
                preLoaders: [{
                    test: /\.(js|jsx)$/,
                    include: /ioc\/(src|tests)/,
                    loader: 'eslint-loader',
                }, {
                    test: /\.js$/,
                    include: /src/,
                    loader: 'isparta',
                }],

                loaders: [{
                    test: /\.js$/,
                    exclude: /(node_modules)/,
                    loader: 'babel',
                }],
            },
            resolve: {
                extensions: ["", ".js"],
                modulesDirectories: ['./src', './node_modules'],
            },
        },
        webpackMiddleware: { noInfo: true }
    });
};
