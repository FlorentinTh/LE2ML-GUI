/* eslint-disable no-undef */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const common = require('./webpack.common.js');

const config = {
  compress: false
};

const prod = {
  mode: 'production',
  devtool: false,
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    filename: 'js/[name].[contenthash:8].bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../'
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['postcss-flexbugs-fixes'],
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        grid: 'true',
                        flexbox: 'no-2009'
                      },
                      stage: 3
                    }
                  ]
                ]
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 75
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 75
              }
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash:8].css',
      chunkFilename: '[id].css'
    }),
    new WebpackManifestPlugin()
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            warnings: true,
            drop_console: true
          },
          output: {
            comments: false
          }
        },
        parallel: true
      }),
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }
            }
          ]
        }
      }),
      '...'
    ],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      maxSize: 95000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },

  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  stats: {
    assets: true,
    assetsSort: '!size',
    builtAt: false,
    cached: false,
    cachedAssets: false,
    children: false,
    chunks: false,
    chunkGroups: false,
    chunkModules: false,
    chunkOrigins: false,
    colors: true,
    entrypoints: false,
    errorDetails: false,
    modules: false,
    warnings: false
  }
};

if (config.compress) {
  prod.plugins.push(
    new CompressionPlugin({
      test: /\.(js|css|svg)$/,
      algorithm: 'gzip',
      deleteOriginalAssets: false
    })
  );
}

module.exports = merge(common, prod);
