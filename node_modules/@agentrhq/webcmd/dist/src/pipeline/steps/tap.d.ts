/**
 * Pipeline step: tap — declarative Store Action Bridge.
 *
 * Generates a self-contained IIFE that:
 * 1. Injects fetch + XHR dual interception proxy
 * 2. Finds the Pinia/Vuex store and calls the action
 * 3. Captures the response matching the URL pattern
 * 4. Auto-cleans up interception in finally block
 * 5. Returns the captured data (optionally sub-selected)
 */
import type { IPage } from '../../types.js';
export declare function stepTap(page: IPage | null, params: unknown, data: unknown, args: Record<string, unknown>): Promise<unknown>;
