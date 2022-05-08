/* eslint-disable import/default */
import {resolve} from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import {TsconfigPathsPlugin} from 'tsconfig-paths-webpack-plugin';
import ZipPlugin from 'zip-webpack-plugin';
import type {Configuration} from 'webpack';

export default {
    mode:   'production',
    entry:  resolve('./src/index.ts'),
    output: {
        path:          resolve('./dist'),
        filename:      'bundle.js',
        libraryTarget: 'commonjs',
    },
    module: {
        rules: [{
            use:     'ts-loader',
            exclude: /node_modules/u,
        }],
    },
    resolve: {
        plugins:    [new TsconfigPathsPlugin()],
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                resolve('./node_modules/swagger-ui-dist'),
            ],
        }),
        new ZipPlugin({
            filename: 'bundle.zip',
            include:  [
                /bundle\.js(?:.*)?$/ui,
                /swagger-ui(?:.*)?\.(?:js|css)$/ui,
                /favicon(?:.*)?\.png$/ui,
            ],
        }),
    ],
} as Configuration;
