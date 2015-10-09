import { NODE_ENV, SRC_DIRNAME } from '../../config';
import makeWebpackConfig from '../webpack/make-config';

const KARMA_ENTRY = 'karma.entry.js';
const WEBPACK_CONFIG = makeWebpackConfig(
  require('../webpack/client')('development')
);

function makeDefaultConfig () {
  return {
    files : [
      './node_modules/phantomjs-polyfill/bind-polyfill.js',
      `./${KARMA_ENTRY}`
    ],
    frameworks : ['chai', 'mocha'],
    preprocessors : {
      [KARMA_ENTRY] : ['webpack'],
      [`${SRC_DIRNAME}/**/*.js`] : ['webpack']
    },
    reporters: ['coverage', 'spec'],
    browsers : ['Chrome'],
    coverageReporter: {
      reporters: [
        { type: 'text' },
      ]
    },
    webpack : {
      devtool : 'inline-source-map',
      resolve : WEBPACK_CONFIG.resolve,
      module  : {
        loaders : WEBPACK_CONFIG.module.loaders,
        postLoaders : [{
          test: /src.+\.(js|jsx)$/, exclude: /(node_modules|tests)/,
          loader: 'istanbul-instrumenter',
        }]
      }
    },
    webpackMiddleware : {
      noInfo : true
    },
    plugins: [
      require('karma-webpack'),
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-coverage'),
      require('karma-chrome-launcher'),
      require('karma-spec-reporter'),
    ]
  };
}

export default function (karmaConfig) {
  return karmaConfig.set(
    require(`./configs/_${NODE_ENV}`)(makeDefaultConfig())
  );
};
