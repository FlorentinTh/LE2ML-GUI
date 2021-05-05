/* eslint-disable no-undef */
const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const { merge } = require('webpack-merge');

const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HTMLWebPackPlugin = require('html-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

const config = {
  SOURCE_FOLDER: path.resolve(__dirname, 'src'),
  DESTINATION_FOLDER: path.resolve(__dirname, 'build'),
  ENABLE_COMPRESSION: false
};

function generateHTMLPlugin(directory) {
  const HTMLFileLocation = fs.readdirSync(path.resolve(__dirname, directory));
  return HTMLFileLocation.filter(file => {
    return (file = file.includes('.html'));
  }).map(file => {
    const parts = file.split('.');
    const name = parts[0];
    const ext = parts[1];

    return new HTMLWebPackPlugin({
      filename: name + '.html',
      inject: true,
      scriptLoading: 'defer',
      favicon: path.join(config.SOURCE_FOLDER, 'public', 'favicon.ico'),
      template: path.join(config.SOURCE_FOLDER, 'public', name + '.' + ext)
    });
  });
}

const HTMLPlugin = generateHTMLPlugin(path.resolve(config.SOURCE_FOLDER, 'public'));

module.exports = (env, options) => {
  const isProd = options.mode === 'production';

  const COMMON = {
    mode: isProd ? 'production' : 'development',
    output: {
      path: config.DESTINATION_FOLDER,
      filename: 'scripts/bundle' + (isProd ? '.[hash:12].min.js' : '.js')
    },
    resolve: {
      fallback: {
        process: 'process/browser',
        util: require.resolve('util/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify')
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          enforce: 'pre',
          test: /\.(js|s?[ca]ss)$/,
          include: config.SOURCE_FOLDER,
          loader: 'import-glob'
        },
        {
          test: /\.(png|jpe?g|gif|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'img/[name]_[hash:12][ext]'
          }
        },
        {
          test: /\.(woff(2)?|otf|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 4 * 1024
            }
          },
          generator: {
            filename: 'font/[name]_[hash:12][ext]'
          }
        },
        {
          test: /\.hbs$/,
          loader: 'handlebars-loader',
          options: {
            helperDirs: path.join(config.SOURCE_FOLDER, '/helpers/handlebars')
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
    plugins: [
      new ProgressBarPlugin(),
      new FriendlyErrorsWebpackPlugin(),
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        'window.env.API_URL': JSON.stringify('https://localhost:3000/api'),
        'window.env.API_VERSION': JSON.stringify('1'),
        'window.env.API_PROXY': JSON.stringify('https://cors-anywhere.herokuapp.com'),
        'window.env.FILE_SERVER_URL': JSON.stringify('http://localhost:8080'),
        'window.env.JOB_LOGS_FILE': JSON.stringify('/.app-data/jobs.log')
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser'
      })
    ].concat(HTMLPlugin)
  };

  const DEV = {
    entry: path.join(config.SOURCE_FOLDER, 'main.js'),
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
    plugins: [new webpack.HotModuleReplacementPlugin()],
    devtool: 'source-map',
    devServer: {
      hot: true,
      compress: false,
      port: 8000,
      quiet: true,
      open: true
    },
    stats: {
      modules: false
    }
  };

  const PROD = {
    entry: {
      main: path.join(config.SOURCE_FOLDER, 'main.js'),
      fontAwesome: path.join(config.SOURCE_FOLDER, 'styles', 'font-awesome.scss')
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
                sourceMap: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: () => [
                  require('postcss-flexbugs-fixes'),
                  require('postcss-preset-env')({
                    autoprefixer: {
                      grid: 'true',
                      flexbox: 'no-2009'
                    },
                    stage: 3
                  }),
                  postcssNormalize()
                ],
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
      modules: false
    },
    performance: {
      hints: false
    },
    optimization: {
      minimize: true,
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        maxSize: 95000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return 'npm.' + packageName.replace('@', '');
            }
          }
        }
      },
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
          // cache: true,
          parallel: true
          // sourceMap: false
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
        })
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        chunkFilename: 'styles/[name]' + (isProd ? '.[hash:12].min.css' : '.css')
      }),
      new WebpackManifestPlugin()
    ]
  };

  if (config.ENABLE_COMPRESSION) {
    PROD.plugins.push(
      new CompressionPlugin({
        test: /\.(js|css|svg)$/,
        algorithm: 'gzip',
        deleteOriginalAssets: false
      })
    );
  }

  return isProd ? merge(COMMON, PROD) : merge(COMMON, DEV);
};
