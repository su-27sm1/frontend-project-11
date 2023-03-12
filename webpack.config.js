import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

export default {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(fileURLToPath(import.meta.url), 'dist'),
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/i,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js'],
  },
};
