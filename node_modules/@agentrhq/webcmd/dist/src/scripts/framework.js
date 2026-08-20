/**
 * Injected script for detecting frontend frameworks (Vue, React, Next, Nuxt, etc.)
 *
 * Serialized via `.toString()` and evaluated in the page context. Types here are
 * only for the TS boundary — see scripts/store.ts for the same pattern.
 */
export function detectFramework() {
    const r = {};
    try {
        const app = document.querySelector('#app');
        const w = window;
        r.vue3 = !!(app && app.__vue_app__);
        r.vue2 = !!(app && app.__vue__);
        r.react = !!w.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector('[data-reactroot]');
        r.nextjs = !!w.__NEXT_DATA__;
        r.nuxt = !!w.__NUXT__;
        if (r.vue3 && app?.__vue_app__) {
            const gp = app.__vue_app__.config?.globalProperties;
            r.pinia = !!(gp && gp.$pinia);
            r.vuex = !!(gp && gp.$store);
        }
    }
    catch { }
    return r;
}
