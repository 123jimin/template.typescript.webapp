// @ts-check
/** @import { BuildParams } from "./builder" */

const esbuild = require('esbuild');

class Builder {
    /** @type {BuildParams} */
    args;

    /**
     * @param {Partial<BuildParams>} args 
     */
    constructor(args) {
        this.args = {
            mode: 'dev',
            sourcemap: 'linked',
            serve: false,
            ...args,
        };
    }

    async run() {
        console.log("Builder running with:", this.args);

        const build_config = await this.creteBuildConfig();

        if(this.args.serve) {
            const ctx = await esbuild.context(build_config);
            await this.serveLiveReloadServer(ctx);
        } else {
            await esbuild.build(build_config);
        }
    }

    /** 
     * @param {Awaited<ReturnType<typeof esbuild.context>>} ctx 
     */
    async serveLiveReloadServer(ctx) {
        await ctx.watch();
        
        const {host, port} = await ctx.serve({
            servedir: "./serve/",
        });

        console.log(`Serving on http://${host === "0.0.0.0" ? "localhost" : host}:${port}/debug`);

        await new Promise(() => {});
    }

    /* esbuild configs */
    
    async creteBuildConfig() {
        return {
            entryPoints: ["./src/index.ts"],
            bundle: this.opt_bundle,
            outfile: this.opt_outfile,
            target: ["chrome131", "firefox133"],

            minify: this.opt_minify,
            sourcemap: this.opt_sourcemap,
        };
    }

    get opt_bundle() {
        return true;
    }

    get opt_outfile() {
        return "./serve/build/index.js";
    }

    get opt_minify() {
        switch(this.args.mode) {
            case 'dev': return false;
            case 'prod': return true;
        }
    }
    
    /** @type {BuildParams['sourcemap']} */
    get opt_sourcemap() {
        return this.args.sourcemap;
    }
}

module.exports = { Builder };