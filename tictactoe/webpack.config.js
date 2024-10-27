import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('webpack').Configuration}
 */
export default {
  entry: './main.ts',
  output: {
    path: resolve(__dirname, '../dist/tictactoe'),
    filename: 'main.js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.json', '.ts'],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html', favicon: resolve('./assets/favicon.svg') }),
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.svg$/i,
        type: 'asset/resource',
        generator: { filename: 'assets/[name][ext]' },
      },
    ],
  },
  optimization: {
    minimizer: [`...`, new CssMinimizerPlugin()],
  },
  devServer: {
    compress: true,
    hot: true,
    open: true,
    port: 3000,
    watchFiles: ['*'],
  },
};
