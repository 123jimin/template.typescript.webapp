// @ts-check

/** @typedef {{added: string[], removed: string[], updated: string[]}} ChangeData */

document.addEventListener('DOMContentLoaded', async () => {
    /**
     * @param {string[]} changed
     * @returns {boolean}
     */
    function tryReload(changed) {
        for(const path of changed) {
            if(path.endsWith(".js")) {
                console.log("%cReloading...", "color: #F90");
                window.location.reload();
                return true;
            }
        }

        return false;
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

    async function loadCSS(css_path) {
        for(const child of document.querySelectorAll("head>link,head>style")) {
            if(child.parentNode === document.head) {
                document.head.removeChild(child);
            }
        }

        await new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.addEventListener('load', resolve);
            link.addEventListener('error', reject);
            document.head.appendChild(link);
            
            link.rel = 'stylesheet';
            link.href = `${css_path}?t=${Date.now()}`;
        });
    }

    console.log("%cLoading CSS...", "color: #33F");
    await loadCSS("/build/index.css");

    console.log("%cListening for changes...", "color: #33F");
    new EventSource("/esbuild").addEventListener('change', (event) => {
        try {
            /** @type {ChangeData} */
            const data = JSON.parse(event.data);
            const changed = [...data.added, ...data.updated];

            console.info(`%cUpdated file${changed.length === 1 ? 's' : ''}: ${changed.join(", ")}`, "color: #888");

            if(tryReload(changed)) return;
            if(tryReloadCSS(changed)) return;
        } catch(err) {}
    });
});