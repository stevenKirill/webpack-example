const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;
const alias = require('./alias');

const config = {
  entry: path.resolve(__dirname, './src/index.tsx'),
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js?version=[chunkhash:8]',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: "[path][name]__[local]--[hash:base64:5]",
              }
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
    ]
  },
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
    alias,
    fallback: {
      buffer: false,
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css?version=[chunkhash:8]',
      ignoreOrder: true
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      filename: path.resolve(__dirname, './build/index.html'),
    }),
  ],
  devServer: {
    port: "9500",
    static: ["./build"],
    open: true,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: false,
        warnings: false,
      },
    },
    proxy: {
      '/api/v1': 'http://localhost:8080'
    },
  },
  optimization: {
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all',
      minSize: 90 * 1024,
      maxSize: 244 * 1024,
      minChunks: 2,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      cacheGroups: {
        default: {
          name: 'default',
          minChunks: 1,
          priority: -20,
          reuseExistingChunk: true
        },
        defaultVendors: {
          name: 'vendors',
          test: /node_modules/,
          priority: -10
        },
        async: {
          name: 'async',
          enforce: true,
          priority: 0,
          chunks: 'async'
        }
      }
    }
  }
}

module.exports = (env, options) => {
  const isProd = options.mode === 'production';
  const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});

  if (env.analyze) {
    config.plugins.push(new StatoscopeWebpackPlugin({
      saveReportTo: path.resolve(__dirname, './reports/report-[name]-[hash].html'),
      saveStatsTo: path.resolve(__dirname, './stats/stats-[name]-[hash].json'),
      name: 'gpb-expert-front'
    }))
  }
  config.plugins.push(new webpack.DefinePlugin(envKeys));

  config.devtool = isProd ? !isProd : 'inline-source-map';
  config.target = isProd ? 'browserslist' : 'web';

  return config;
}
