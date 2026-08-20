import type { CliCommand } from './registry.js';
/**
 * Pipeline steps that require a live browser session.
 *
 * Note: this is the *subset* of registered pipeline steps that need a page;
 * non-browser steps (fetch, select, map, filter, sort, limit, download)
 * deliberately stay out. The full registered-step list lives in
 * `src/pipeline/registry.ts` and is re-derived elsewhere via
 * `getRegisteredStepNames()` (e.g. in `validate.ts`). When you add a new
 * pipeline step, decide whether it belongs here based on whether its handler
 * touches the IPage object — and `src/capabilityRouting.test.ts` verifies the
 * subset relationship is intact.
 */
export declare const BROWSER_ONLY_STEPS: Set<string>;
/** Internal helper: ensure BROWSER_ONLY_STEPS is a subset of registered pipeline steps. */
export declare function _validateBrowserOnlyStepsAgainstRegistry(): {
    extras: string[];
};
export declare function shouldUseBrowserSession(cmd: CliCommand): boolean;
