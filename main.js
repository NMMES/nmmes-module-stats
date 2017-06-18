'use strict';

const nmmes = require('nmmes-backend');
const Logger = nmmes.Logger;
const chalk = require('chalk');
const stringify = require('csv-stringify');
const isStream = require('isstream');
const Promise = require('bluebird');
const fs = require('fs-extra');
const Path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const moment = require('moment');
const get = require('lodash.get');
require("moment-duration-format");

/**
 * Arguments
 * type - The type of output to be created
 * output - Either a path relative to the video output directory or a stream
 */

module.exports = class Stats extends nmmes.Module {
    constructor(args) {
        super(require('./package.json'));

        this.args = Object.assign({
            type: 'csv',
            output: 'stats.csv',
            data: ['metadata.input.format.filename', 'reduction.percent', 'reduction.size']
        }, args);
    }
    createOutput() {
        let _self = this;
        return new Promise(function(resolve, reject) {

            let output = _self.args.output;

            if (!output.startsWith(Path.sep)) {
                if (output.startsWith('.'+Path.sep)) {
                    output = Path.resolve(process.cwd(), output);
                } else {
                    output = Path.resolve(_self.video.output.dir, output);
                }
            }

            fs.ensureDir(Path.dirname(output)).then(() => {
                _self.outputStream = fs.createWriteStream(output).once('error', reject).once('open', () => {
                    // Process output type
                    if (_self.args.type === 'csv') {
                        _self.parser = stringify({
                            header: true,
                            columns: _self.args.data
                        }).on('error', function(err) {
                            Logger.error('Parser error:', err.message);
                            Logger.trace(err);
                        });
                    } else {
                        return reject(new Error('Unknown parser type.'));
                    }

                    _self.parser.pipe(_self.outputStream);
                    resolve();
                });
            }, reject);

        });
    }
    executable(video, map) {
        let _self = this;
        this.video = video;

        return new Promise(function(resolve, reject) {
            // Promise.props({
            //     inputStat: stat(video.input.path),
            //     outputStat: stat(video.output.path)
            // })
            _self.createOutput().then(function(results) {
                let data = {
                    metadata: {
                        input: video.input.metadata[0],
                        output: video.output.metadata,
                    },
                    reduction: {
                        size: video.input.metadata[0].format.size - video.output.metadata.format.size,
                        percent: (100 - ((video.output.metadata.format.size / video.input.metadata[0].format.size) * 100)).toFixed(2)
                    }
                };

                let outputData = _self.args.data.reduce(function(result, value, index) {
                    result.push(get(data, value));
                    return result;
                }, []);

                _self.parser.write(outputData);
                _self.parser.end();
                resolve();
            }, reject);
        });
    };
}
