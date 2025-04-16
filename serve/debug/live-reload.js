// @ts-check

/** @typedef {{added: string[], removed: string[], updated: string[]}} ChangeData */

document.addEventListener('DOMContentLoaded', async () => {
    let reload_attempted = false;

    /**
     * @param {string[]} changed
     * @returns {boolean}
     */
    function tryReload(changed) {
        for(const path of changed) {
            if(path.endsWith(".js")) {
                if(reload_attempted) return true;

                console.log("%cReloading...", "color: #F90");
                window.location.reload();
                reload_attempted = true;

                return true;
            }
        }

        return false;
    }

    /**
     * @param {string} css_path
     */
    async function loadCSS(css_path) {
        for(const child_raw of document.querySelectorAll("head>link,head>style")) {
            const child = /** @type {HTMLStyleElement|HTMLLinkElement} */ (child_raw);
            if(child.dataset["remove_on_reload"] === "true") {
                document.head.removeChild(child);
            }
        }

        await new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.dataset["remove_on_reload"] = "true";

            link.addEventListener('load', resolve);
            link.addEventListener('error', reject);
            document.head.appendChild(link);

            link.rel = 'stylesheet';
            link.href = `${css_path}?t=${Date.now()}`;
        });
    }

    /**
     * @param {string[]} changed
     * @returns {boolean}
     */
    function tryReloadCSS(changed) {
        for(const path of changed) {
            if(path.endsWith(".css")) {
                console.log("%cUpdating CSS...", "color: #F90");
                void loadCSS(path).catch((e) => console.error("Failed to update CSS:", e));
                return true;
            }
        }

        return false;
    }

    console.log("%cLoading CSS...", "color: #33F");
    await loadCSS("/build/index.css");

    console.log("%cListening for changes...", "color: #33F");
    const esbuild = new EventSource("/esbuild");
    esbuild.addEventListener('change', (event) => {
        setTimeout(() => {
            try {
                /** @type {ChangeData} */
                const data = JSON.parse(event.data);
                const changed = [...data.added, ...data.updated];

                console.info(`%cUpdated file${changed.length === 1 ? 's' : ''}: ${changed.join(", ")}`, "color: #888");

                if(tryReload(changed)) return;
                if(tryReloadCSS(changed)) return;
            } catch(err) {
                console.error(err);
            }
        });
    });
    esbuild.addEventListener('error', (event) => {
        console.error("esbuild error:", event);
        esbuild.close();
        document.body.classList.add("live-reload-error");
    });
});