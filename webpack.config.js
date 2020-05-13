/* eslint-disable no-undef */
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HTMLWebPackPlugin = require('html-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const ManifestPlugin = require('webpack-manifest-plugin');

const fs = require('fs');

const config = {
  sourceFolder: path.resolve(__dirname, 'src'),
  destinationFolder: path.resolve(__dirname, 'build'),
  enableJQuery: false,
  enableCompression: false
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
      favicon: path.join(config.sourceFolder, 'public', 'favicon.ico'),
      template: path.join(config.sourceFolder, 'public', name + '.' + ext)
    });
  });
}

const HTMLPlugin = generateHTMLPlugin(path.resolve(config.sourceFolder, 'public'));

module.exports = (env, options) => {
  const isProd = options.mode === 'production';

  const COMMON = {
    mode: isProd ? 'production' : 'development',
    output: {
      path: config.destinationFolder,
      filename: 'scripts/bundle' + (isProd ? '.[hash:12].min.js' : '.js')
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
          include: config.sourceFolder,
          loader: 'import-glob'
        },
        {
          test: /\.(ttf|otf|eot|woff2?|png|jpe?g|gif|svg|ico)$/,
          include: config.sourceFolder,
          loader: 'url-loader',
          options: {
            limit: 1024,
            name: '[name].[hash:12].[ext]',
            useRelativePath: true,
            outputPath: 'img/',
            esModule: false
          }
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/'
              }
            }
          ]
        },
        {
          test: /\.hbs$/,
          loader: 'handlebars-loader',
          options: {
            helperDirs: path.join(config.sourceFolder, '/helpers/handlebars')
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
      new CleanWebpackPlugin()
    ].concat(HTMLPlugin)
  };

  if (config.enableJQuery) {
    COMMON.plugins.push(
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery'
      })
    );
  }

  const DEV = {
    entry: path.join(config.sourceFolder, 'main.js'),
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
      main: path.join(config.sourceFolder, 'main.js'),
      fontAwesome: path.join(config.sourceFolder, 'styles', 'font-awesome.scss')
    },
    module: {
      rules: [
        // {
        //   enforce: 'pre',
        //   test: /\.js$/,
        //   exclude: /node_modules/,
        //   loader: 'eslint-loader'
        // },
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
          vendor: {
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
          cache: true,
          parallel: true,
          sourceMap: false
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessor: require('cssnano'),
          cssProcessorPluginOptions: {
            preset: ['advanced', { discardComments: { removeAll: true } }]
          }
        })
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        chunkFilename: 'styles/[name]' + (isProd ? '.[hash:12].min.css' : '.css')
      }),
      new ManifestPlugin()
    ]
  };

  if (config.enableCompression) {
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
