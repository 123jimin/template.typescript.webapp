// @ts-check
/** @import { BuildParams } from "./builder" */
/** @import { BuildOptions } from "esbuild"; */

import fs from "node:fs/promises";
import esbuild from "esbuild";

export class Builder {
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
        await this.#buildServeDebugHTML();
        await ctx.watch();

        const {hosts, port} = await ctx.serve({
            servedir: "./serve/",
        });

        const LOOPBACK_DOMAIN_REGEX = /^(?:localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|\[::1\]|::1)$/i;

        const urls = (
            hosts.length > 0 && hosts.find((s) => s.match(LOOPBACK_DOMAIN_REGEX)) == null ? hosts : ["localhost"]
        ).map((host) => `http://${host === "0.0.0.0" ? "localhost" : host}:${port}/debug`);

        console.log(`Serving on ${urls.join(', ')}`);

        await new Promise(() => {});
    }

    /* esbuild configs */

    /** @returns {Promise<BuildOptions>} */
    async creteBuildConfig() {
        return {
            entryPoints: ["./src/index.ts"],
            bundle: true,
            outdir: "./serve/build/",
            target: ["chrome135", "firefox137"],

            alias: {
                "react": "preact/compat",
                "react-dom/test-utils": "preact/test-utils",
                "react-dom": "preact/compat",
                "react/jsx-runtime": "preact/jsx-runtime",
            },

            minify: this.opt_minify,
            sourcemap: this.opt_sourcemap,
        };
    }

    get opt_minify() {
        switch(this.args.mode) {
            case 'dev': return false;
            case 'prod': return true;
        }

        throw new Error(`Invalid mode: ${this.args.mode}`);
    }

    /** @type {BuildParams['sourcemap']} */
    get opt_sourcemap() {
        return this.args.sourcemap;
    }

    async #buildServeDebugHTML() {
        let html = await fs.readFile("./serve/index.html", "utf-8");
        html = html.split('\n').map((line) => {
            if(line.includes("build/index.css")) {
                return DEBUG_INJECT_STYLE;
            }

            if(line.includes("build/index.js")) {
                return DEBUG_INJECT_SCRIPT;
            }

            return line;
        }).join('\n');

        await fs.writeFile("./serve/debug/index.html", html, "utf-8");
    }
}

const DEBUG_INJECT_STYLE = `
<style data-remove_on_reload="true" id="live-reload-style">
body::before {
    display: block;
    content: "Initializing live loading...";
    width: 100%;
    user-select: none;
    text-align: center;
    font-size: 1.5em;
    line-height: 3em;
    color: #AAA;
}
</style>
<style>
body.live-reload-error::after {
    content: "Live reload failed!";
    position: fixed;
    right: 0; bottom: 0;
    color: #F33;
    font-weight: bold;
    font-size: 1.5em;
    padding: .2em .4em;
    text-shadow: 0 0 3px #F33;
}
</style>
`.trim().replaceAll(/\s+/g, ' ');

const DEBUG_INJECT_SCRIPT = `<script src="./live-reload.js"></script><script src="/build/index.js"></script>`;