# NMMES-module-stats

A statistics output module for [nmmes-backend](https://github.com/NMMES/nmmes-backend).

## Features
- Create a statistics file at the end of the encode.

## Installation

[![NPM](https://nodei.co/npm/nmmes-module-stats.png?compact=true)](https://nodei.co/npm/nmmes-module-stats/)

See https://github.com/NMMES/nmmes-cli/wiki/Modules for additional instructions.

## Options

The `--type` option sets the output file type of the statistics file.

Type: String<br>
Default: csv

---

The `--output` option sets the name of the output file.

Type: String<br>
Default: stats.csv

---

The `--data` option determines which statistics should be stored in the statistics file.

Type: Array<br>
Default: metadata.input.format.filename time reduction.percent reduction.size<br>
Example: metadata.input.format.filename metadata.input.format.size metadata.output.format.size metadata.input.streams.0.codec_name

---
