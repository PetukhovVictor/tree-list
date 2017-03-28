const path = require('path');
const applicationConfig = require('./app.config.js');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webpackConfig = {
    context: applicationConfig.source.path,
    entry: './app.js',
    resolve: {
        modules: [
            applicationConfig.source.path,
            'node_modules'
        ],
        extensions: ['.js', '.jsx']
    },
    output: {
        path: applicationConfig.output.path,
        filename: '[name].js',
        chunkFilename: '[name].[hash].js',
        publicPath: '/assets'
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
                loader: ExtractTextPlugin.extract('css-loader!less-loader'),
                include: applicationConfig.source.path
            }
        ]
    },
    /**
     * С помощью CommonChunkPlugin можно будет разбить на несколько фрагментов сборки.
     */
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(applicationConfig.source.path, 'Assets'),
                to: applicationConfig.output.path
            }
        ]),
        new ExtractTextPlugin('./[name].css')
    ],
    devServer: {
        contentBase: applicationConfig.static.path
    }
};

module.exports = webpackConfig;
