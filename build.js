// @ts-check

const { Builder } = require("./scripts/builder");

const args = require('args-parser')(process.argv);

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

process.chdir(__dirname);
main();