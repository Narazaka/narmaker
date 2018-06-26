#!/usr/bin/env node

// tslint:disable no-console

import { NarMaker } from "../lib";

if (process.argv.length !== 3) {
    console.warn("Usage: mkupdates path/to/myghost");
    process.exit(1);
}

NarMaker.withDeveloperOptions(process.argv[2]).then((narMaker) => narMaker.makeUpdatesFile());
