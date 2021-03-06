#!/usr/bin/env node

// tslint:disable no-console

import { NarMaker } from "../lib";

if (process.argv.length !== 4 && process.argv.length !== 5) {
    console.warn("Usage: mknar path/to/myghost path/to/myghost.nar [sjis]");
    process.exit(1);
}

NarMaker.withDeveloperOptions(process.argv[2]).then(
    (narMaker) => narMaker.makeNarFile(process.argv[3], process.argv[4]),
);
