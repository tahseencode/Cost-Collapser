/**
 * Dynamic registry for pipeline steps.
 * Allows core and third-party plugins to register custom YAML operations.
 */
import type { IPage } from '../types.js';
/**
 * Step handler: all pipeline steps conform to this generic interface.
 * TData is the type of the `data` state flowing into the step.
 * TResult is the expected return type.
 */
export type StepHandler<TData = unknown, TResult = unknown, TParams = unknown> = (page: IPage | null, params: TParams, data: TData, args: Record<string, unknown>) => Promise<TResult>;
/**
 * Get a registered step handler by name.
 */
export declare function getStep(name: string): StepHandler | undefined;
/**
 * List all currently registered step names. Used by `validate.ts` to allowlist
 * step names without maintaining a parallel hand-coded list.
 *
 * Note: this depends on registerStep() side effects below already having run.
 * Importing this module triggers all core registrations at the bottom of the
 * file, so the returned array reflects every core + plugin step at call time.
 */
export declare function getRegisteredStepNames(): string[];
/**
 * Register a new custom step handler for the YAML pipeline.
 */
export declare function registerStep(name: string, handler: StepHandler): void;
