const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // o 'production' para builds optimizados
  devtool: 'source-map',
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './src/popup/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/index.html', to: 'index.html' },
        { from: 'public/popup.css', to: 'popup.css' },
        { from: 'public/icons/', to: 'icons/' },
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
