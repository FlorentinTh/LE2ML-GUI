# Upgrade to Webpack 5

_Official migration guide from webpack@4 to webpack@5 [here](https://webpack.js.org/migrate/5/#upgrade-webpack-4-and-its-pluginsloaders)._

## Procedure

### ➡️ Update dependencies to their latest version

```bash
$> npm i <package>@latest
```

### ➡️ in ```package.json```

replace:

```json
"dev": "webpack-dev-server --env=development",
"build": "webpack -p --env=production"
```

by:

```json
"dev": "webpack serve --env development",
"build": "webpack --env production"
```

### ➡️ in ```webpack.config.js```

#### line 14

```js
// replace:
const ManifestPlugin = require('webpack-manifest-plugin');
// by:
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
```

#### line 277

```js
// replace:
vendor: {...}
// by:
defaultVendors: {...}
```

#### line 300

```js
// remove or comment following options :
cache: true,
sourceMap: false
```

#### line 316

```js
// replace:
new ManifestPlugin()
// by:
new WebpackManifestPlugin({})
```

### ➡️ Remove no longer required packages

- Remove ```url-loader``` and ```file-loader``` packages see [webpack@5 asset modules](https://webpack.js.org/guides/asset-modules).

- Remove ```eslint-loader``` package see [webpack@5 migrate from ```eslint-loader```](https://webpack.js.org/plugins/eslint-webpack-plugin/#migrate-from-eslint-loader).

- Remove ```optimize-css-assets-webpack-plugin``` package and replace it by ```css-minimizer-webpack-plugin``` package see doc [here](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).

### ➡️ ```asset modules```

> TODO

### ➡️ ```css-minimizer-webpack-plugin```

#### in ```webpack.config.js``` :

```js
// replace :
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

// by:
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// replace :
minimizer: [
  new TerserPlugin({...}),
  new OptimizeCSSAssetsPlugin({
    cssProcessor: require('cssnano'),
    cssProcessorPluginOptions: {
      preset: ['advanced', { discardComments: { removeAll: true } }]
    }
  })
]

// by :
minimizer: [
  new TerserPlugin({...}),
  new CssMinimizerPlugin({
    parallel: true,
    sourceMap: true,
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
//...
```
