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
        ],
        browsers: ['Chrome'],
        preprocessors: {
            'karma.entry.js' : ['webpack'],
            'src/**/*.js': ['webpack'],
            'tests/**/*.js': ['webpack'],
        },
        reporters: ['coverage', 'spec'],
        coverageReporter: {
            reporters: [
                { type: 'text' },
            ]
        },
        webpack: {
            devtool: 'inline-source-map',
            module: {
                //preLoaders: [{
                //    test: /\.(js|jsx)$/,
                //    exclude: /(node_modules)/,
                //    loader: 'eslint-loader',
                //}],

                loaders: [{
                    test: /\.(js|jsx)?$/,
                    exclude: /(node_modules)/,
                    loader: 'babel-loader',
                }],

                postLoaders: [{
                    test: /.(js|jsx)$/,
                    exclude: /(node_modules|tests)/,
                    loader: 'istanbul-instrumenter',
                }]
            },
            resolve: {
                extensions: ["", ".js"],
                modulesDirectories: ['./src', './node_modules'],
            },
        },
        webpackMiddleware: { noInfo: true }
    });
};
