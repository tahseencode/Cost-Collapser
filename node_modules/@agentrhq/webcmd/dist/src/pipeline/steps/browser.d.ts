/**
 * Pipeline step: navigate, click, type, wait, press, snapshot.
 * Browser interaction primitives.
 */
import type { IPage } from '../../types.js';
export declare function stepNavigate(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepClick(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepType(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepFill(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepWait(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepPress(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
export declare function stepSnapshot(page: IPage | null, params: unknown, _data: unknown, _args: Record<string, unknown>): Promise<unknown>;
export declare function stepEvaluate(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
