/**
 * Dynamic registry for pipeline steps.
 * Allows core and third-party plugins to register custom YAML operations.
 */
// Import core steps
import { stepNavigate, stepClick, stepType, stepFill, stepWait, stepPress, stepSnapshot, stepEvaluate } from './steps/browser.js';
import { stepFetch } from './steps/fetch.js';
import { stepSelect, stepMap, stepFilter, stepSort, stepLimit } from './steps/transform.js';
import { stepIntercept } from './steps/intercept.js';
import { stepTap } from './steps/tap.js';
import { stepDownload } from './steps/download.js';
const _stepRegistry = new Map();
/**
 * Get a registered step handler by name.
 */
export function getStep(name) {
    return _stepRegistry.get(name);
}
/**
 * List all currently registered step names. Used by `validate.ts` to allowlist
 * step names without maintaining a parallel hand-coded list.
 *
 * Note: this depends on registerStep() side effects below already having run.
 * Importing this module triggers all core registrations at the bottom of the
 * file, so the returned array reflects every core + plugin step at call time.
 */
export function getRegisteredStepNames() {
    return [..._stepRegistry.keys()];
}
/**
 * Register a new custom step handler for the YAML pipeline.
 */
export function registerStep(name, handler) {
    _stepRegistry.set(name, handler);
}
// -------------------------------------------------------------
// Auto-Register Core Steps
// -------------------------------------------------------------
registerStep('navigate', stepNavigate);
registerStep('fetch', stepFetch);
registerStep('select', stepSelect);
registerStep('evaluate', stepEvaluate);
registerStep('snapshot', stepSnapshot);
registerStep('click', stepClick);
registerStep('type', stepType);
registerStep('fill', stepFill);
registerStep('wait', stepWait);
registerStep('press', stepPress);
registerStep('map', stepMap);
registerStep('filter', stepFilter);
registerStep('sort', stepSort);
registerStep('limit', stepLimit);
registerStep('intercept', stepIntercept);
registerStep('tap', stepTap);
registerStep('download', stepDownload);
