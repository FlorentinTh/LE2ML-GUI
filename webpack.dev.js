/* eslint-disable no-undef */
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',

  devServer: {
    historyApiFallback: true,
    open: true,
    compress: false,
    hot: true,
    port: 8080,
    client: {
      progress: true,
      logging: 'error',
      overlay: true
    }
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  stats: {
    modules: false
  }
});
