/**
 * Utility functions for browser operations
 */
type EvaluateFunction = (...args: never[]) => unknown;
/**
 * Serialize a function-form page.evaluate call for CDP Runtime.evaluate.
 *
 * Functions execute in the browser page context, so they cannot close over
 * Node-side variables. Pass external values as JSON-serializable args instead.
 */
export declare function serializeFunctionForEval(fn: EvaluateFunction, args?: readonly unknown[]): string;
/**
 * Wrap JS code for CDP Runtime.evaluate:
 * - Already an IIFE `(...)()` → send as-is
 * - Arrow/function literal → wrap as IIFE `(code)()`
 * - `new Promise(...)` or raw expression → send as-is (expression)
 */
export declare function wrapForEval(js: string): string;
export declare function buildEvaluateExpression(input: string | EvaluateFunction, args?: readonly unknown[]): string;
export {};
