/**
 * Pipeline executor: runs YAML pipeline steps sequentially.
 */
import type { IPage } from '../types.js';
export interface PipelineContext {
    args?: Record<string, unknown>;
    debug?: boolean;
    /** Max retry attempts per step (default: 2 for browser steps, 0 for others) */
    stepRetries?: number;
}
export declare function executePipeline(page: IPage | null, pipeline: unknown[], ctx?: PipelineContext): Promise<unknown>;
