# Upgrade to Webpack 5.x

## package.json

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

## webpack.config.js

### line 14

```js
// replace:
const ManifestPlugin = require('webpack-manifest-plugin');
// by:
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
```

### line 277

```js
// replace:
vendor: {...}
// by:
defaultVendors: {...}
```

### line 300

```js
// remove or comment following options :
cache: true,
sourceMap: false
```

### line 316

```js
// replace:
new ManifestPlugin()
// by:
new WebpackManifestPlugin({})
```
