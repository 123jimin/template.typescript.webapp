// @ts-check

import process from 'node:process';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import argsParser from "args-parser";
import {Builder} from "./scripts/builder.mjs";

const args = argsParser(process.argv);

switch(args.sourcemap) {
    case 'false': args.sourcemap = false; break;
    case 'true': args.sourcemap = true; break;
}

async function main() {
    try {
        const builder = new Builder(args);
        await builder.run();
        process.exit(0);
    } catch(e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

process.chdir(dirname(fileURLToPath(import.meta.url)));
main();
