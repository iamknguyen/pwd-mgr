const path = require('path')
const dotenv = require('dotenv');
const webpack = require('webpack');

dotenv.config()
const isProduction = process.env.NODE_ENV != 'development';
const plugins = [
  new webpack.IgnorePlugin(/\.\/native/, /\/pg\//)
]
console.info(`Building Web Server in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`)

const webpackConfig = {
  entry: './src/app.ts',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'build')
  },
  plugins: plugins
}

// if(isProduction) {
//   webpackConfig.plugins.push(
//     new CopyModulesPlugin({
//     destination: 'nexusiq'
//     }),
//   )
// } else {
  webpackConfig.devtool = 'inline-source-map'
// }

module.exports = webpackConfig