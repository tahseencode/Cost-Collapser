/**
 * Pipeline steps: data transforms — select, map, filter, sort, limit.
 */
import type { IPage } from '../../types.js';
export declare function stepSelect(_page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepMap(_page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepFilter(_page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepSort(_page: IPage | null, params: unknown, data: unknown, _args: Record<string, unknown>): Promise<unknown>;
export declare function stepLimit(_page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
