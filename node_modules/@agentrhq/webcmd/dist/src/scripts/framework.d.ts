/**
 * Injected script for detecting frontend frameworks (Vue, React, Next, Nuxt, etc.)
 *
 * Serialized via `.toString()` and evaluated in the page context. Types here are
 * only for the TS boundary — see scripts/store.ts for the same pattern.
 */
export declare function detectFramework(): Record<string, boolean>;
