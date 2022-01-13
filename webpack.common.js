/* eslint-disable no-undef */
const path = require('path');
const fs = require('fs');
const { DefinePlugin, ProvidePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require('dotenv');

const generateHTMLPlugin = directory => {
  const HTMLFileLocation = fs.readdirSync(path.resolve(__dirname, directory));
  return HTMLFileLocation.filter(file => {
    return (file = file.includes('.html'));
  }).map(file => {
    const parts = file.split('.');
    const name = parts[0];
    const ext = parts[1];

    return new HtmlWebpackPlugin({
      filename: name + '.html',
      inject: true,
      scriptLoading: 'defer',
      favicon: path.join(__dirname, 'src', 'public', 'favicon.ico'),
      template: path.join(__dirname, 'src', 'public', name + '.' + ext)
    });
  });
};

const HTMLPlugin = generateHTMLPlugin(path.join(__dirname, 'src', 'public'));

module.exports = {
  entry: {
    main: path.join(__dirname, 'src', 'main.js'),
    fontAwesome: path.join(__dirname, 'src', 'styles', 'utils', '_font.scss')
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: '/'
  },
  infrastructureLogging: {
    level: 'info'
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['*.LICENSE.txt']
    }),
    new DefinePlugin({
      'window.env': JSON.stringify(dotenv.config().parsed)
    }),
    new ProvidePlugin({
      process: 'process/browser'
    })
  ].concat(HTMLPlugin),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name].[contenthash:8][ext]'
        }
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 1024
          }
        },
        generator: {
          filename: 'font/[name].[contenthash:8][ext]'
        }
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader',
        options: {
          helperDirs: path.join(__dirname, 'src', 'helpers', 'handlebars')
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
              esModule: true
            }
          }
        ]
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.join(__dirname, 'src'),
      process: 'process/browser'
    },
    fallback: {
      util: require.resolve('util/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      url: require.resolve('url')
    }
  }
};
