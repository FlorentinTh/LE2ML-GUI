const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HTMLWebPackPlugin = require('html-webpack-plugin');
const postcssNormalize = require('postcss-normalize');
const fs = require('fs');

const config = {
	sourceFolder: path.resolve(__dirname, 'src'),
	destinationFolder: path.resolve(__dirname, 'build'),
	enableJQuery: false,
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
			filename: `${name}.html`,
			inject: true,
			template: path.join(config.sourceFolder, `${name}.${ext}`),
		});
	});
}

const HTMLPlugin = generateHTMLPlugin(path.resolve(__dirname, 'src'));

module.exports = (env, options) => {
	const isProd = options.mode === 'production';

	const COMMON = {
		mode: isProd ? 'production' : 'development',
		entry: path.join(config.sourceFolder, 'main.js'),
		output: {
			path: config.destinationFolder,
			filename: 'scripts/bundle' + (isProd ? '.[hash:12].min.js' : '.js'),
		},
		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.js$/,
					exclude: /node_modules/,
					loader: 'eslint-loader',
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
					},
				},
				{
					enforce: 'pre',
					test: /\.(js|s?[ca]ss)$/,
					include: config.sourceFolder,
					loader: 'import-glob',
				},
				{
					test: /\.(ttf|otf|eot|woff2?|png|jpe?g|gif|svg|ico)$/,
					include: config.sourceFolder,
					loader: 'url-loader',
					options: {
						limit: 2048,
						name: '[name].[hash:12].[ext]',
						useRelativePath: true,
						outputPath: 'img/',
						esModule: false,
					},
				},
				{
					test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[name].[ext]',
								outputPath: 'fonts/',
							},
						},
					],
				},
				{
					test: /\.html$/,
					use: [
						{
							loader: 'html-loader',
							options: {
								minimize: false,
								esModule: false,
							},
						},
					],
				},
			],
		},
		plugins: [
			new CleanWebpackPlugin({
				verbose: true,
			}),
		].concat(HTMLPlugin),
	};

	if (config.enableJQuery) {
		COMMON.plugins.push(
			new webpack.ProvidePlugin({
				$: 'jquery',
				jQuery: 'jquery',
			})
		);
	}

	const DEV = {
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					use: ['style-loader', 'css-loader', 'sass-loader'],
				},
			],
		},
		plugins: [new webpack.HotModuleReplacementPlugin()],
		devtool: 'source-map',
		devServer: {
			hot: true,
			compress: true,
			port: 8080,
		},
	};

	const PROD = {
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
							options: {
								publicPath: '../',
							},
						},
						{
							loader: 'css-loader',
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
											flexbox: 'no-2009',
										},
										stage: 3,
									}),
									postcssNormalize(),
								],
								sourceMap: true,
							},
						},
						'sass-loader',
					],
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
									quality: 75,
								},
								optipng: {
									enabled: false,
								},
								pngquant: {
									quality: [0.65, 0.9],
									speed: 4,
								},
								gifsicle: {
									interlaced: false,
								},
								webp: {
									quality: 75,
								},
							},
						},
					],
				},
			],
		},
		optimization: {
			minimize: true,
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						compress: {
							warnings: true,
							drop_console: true,
						},
						output: {
							comments: false,
						},
					},
					cache: true,
					parallel: true,
					sourceMap: false,
				}),
				new OptimizeCSSAssetsPlugin({
					cssProcessor: require('cssnano'),
					cssProcessorPluginOptions: {
						preset: [
							'default',
							{ discardComments: { removeAll: true } },
						],
					},
				}),
			],
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename:
					'styles/main' + (isProd ? '.[hash:12].min.css' : '.css'),
			}),
		],
	};

	return isProd ? merge(COMMON, PROD) : merge(COMMON, DEV);
};
