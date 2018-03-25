'use strict';

const nmmes = require('nmmes-backend');
const Logger = nmmes.Logger;
const chalk = require('chalk');
const stringify = require('csv-stringify');
const isStream = require('isstream');
const fs = require('fs-extra');
const Path = require('path');
const moment = require('moment');
const get = require('lodash.get');
require("moment-duration-format");

module.exports = class Stats extends nmmes.Module {
    constructor(args, logger = Logger) {
        super(require('./package.json'));
        this.logger = logger;

        this.options = Object.assign(nmmes.Module.defaults(Stats), args);
    }
    createOutput() {
        return new Promise(async (resolve, reject) => {
            let output = this.options.output;

            // Process output type
            if (this.options.type === 'csv') {
                this.parser = stringify({
                    header: true,
                    columns: this.options.data
                }).once('error', reject);
            } else {
                return reject(new Error(`Unknown parser type: ${this.options.type}`));
            }

            if (isStream(output)) { // Is a stream
                this.outputStream = output;
                this.parser.pipe(this.outputStream);
                resolve();
            } else { // Is not a stream, hopefully a string...
                if (!output.startsWith(Path.sep)) {
                    if (output.startsWith('.' + Path.sep)) {
                        output = Path.resolve(process.cwd(), output);
                    } else {
                        output = Path.resolve(this.video.output.dir, output);
                    }
                }

                await fs.ensureDir(Path.dirname(output));
                this.outputStream = fs.createWriteStream(output, {
                    flags: 'a'
                }).once('error', reject).once('open', () => {
                    this.parser.pipe(this.outputStream);
                    resolve({});
                });
            }
        });
    }
    async executable(map) {
        let results = await this.createOutput();
        let data = {
            metadata: {
                input: this.video.input.metadata[0],
                output: this.video.output.metadata,
            },
            reduction: {
                size: this.video.input.metadata[0].format.size - this.video.output.metadata.format.size,
                percent: (100 - ((this.video.output.metadata.format.size / this.video.input.metadata[0].format.size) * 100)).toFixed(2)
            }
        };

        let outputData = this.options.data.reduce(function(result, value, index) {
            result.push(get(data, value));
            return result;
        }, []);

        this.parser.write(outputData);
        this.parser.end();
    };
    static options() {
        return {
            'type': {
                default: 'csv',
                describe: 'Output format of statistics.',
                // choices: ['csv', 'json'],
                choices: ['csv'],
                type: 'string',
                group: 'General:'
            },
            'output': {
                default: 'stats.csv',
                describe: 'Path to output file.',
                type: 'string',
                group: 'General:'
            },
            'data': {
                default: ['metadata.input.format.filename', 'reduction.percent', 'reduction.size'],
                describe: 'Data selections to include in the statistics file',
                choices: ['metadata.input.format.filename', 'reduction.percent', 'reduction.size'],
                type: 'array',
                group: 'Advanced:'
            },
        };
    }
}
