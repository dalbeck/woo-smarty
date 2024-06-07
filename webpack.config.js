const path = require('path');

module.exports = {
    mode: 'development', // Set to 'production' for production builds
    entry: './src/js/index.js',
    output: {
        filename: 'smarty-validation.js',
        path: path.resolve(__dirname, 'dist/js'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
};
