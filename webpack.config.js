const path = require('path');
const applicationConfig = require('./app.config.js');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webpackConfig = {
    entry: './src/app.js',
    resolve: {
        extensions: ['.js', '.jsx']
    },
    output: {
        path: path.resolve(applicationConfig.output.path, 'assets'),
        filename: '[name].js',
        publicPath: './'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: applicationConfig.source.path
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('css!less'),
                include: applicationConfig.source.path
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(applicationConfig.source.path, 'Assets'),
                to: applicationConfig.output.path
            }
        ])
    ]
};

module.exports = webpackConfig;
