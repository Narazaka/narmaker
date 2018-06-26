#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
if (process.argv.length !== 4) {
    console.warn("Usage: mknar path/to/myghost path/to/myghost.nar");
    process.exit(1);
}
lib_1.NarMaker.withDeveloperOptions(process.argv[2]).then((narMaker) => narMaker.makeNarFile(process.argv[3]));
