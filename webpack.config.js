const applicationConfig = require('./app.config.js');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webpackConfig = {
    entry: './src/app.js',
    resolve: {
        extensions: ['.js', '.jsx']
    },
    output: {
        path: applicationConfig.output.path,
        filename: '[name].js',
        publicPath: './'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel',
                include: applicationConfig.source.path
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('css!less'),
                include: applicationConfig.source.path
            }
        ]
    }
};

module.exports = webpackConfig;
