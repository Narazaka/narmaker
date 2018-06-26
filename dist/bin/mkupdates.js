#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
if (process.argv.length !== 3) {
    console.warn("Usage: mkupdates path/to/myghost");
    process.exit(1);
}
lib_1.NarMaker.withDeveloperOptions(process.argv[2]).then((narMaker) => narMaker.makeUpdatesFile());
