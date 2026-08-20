/**
 * Persistent cache for browser network captures.
 *
 * The live capture buffer (JS interceptor / daemon ring) can be cleared
 * by navigation or lost between CLI invocations. Agents still need
 * stable references to request bodies after running other commands,
 * so every `browser network` call snapshots its results to disk.
 *
 * Layout: <cacheDir>/browser-network/<session>.json
 * Entries expire after DEFAULT_TTL_MS (24h).
 */
export declare const DEFAULT_TTL_MS: number;
export interface CachedNetworkEntry {
    key: string;
    url: string;
    method: string;
    status: number;
    /** Full body size in chars (may exceed stored body length when truncated). */
    size: number;
    ct: string;
    body: unknown;
    /**
     * Truncation signals use snake_case so `--raw` (which emits cache entries
     * verbatim) matches the agent-facing contract used by list / --detail.
     */
    body_truncated?: boolean;
    body_full_size?: number;
    timestamp?: number;
}
export interface NetworkCacheFile {
    version: 1;
    session: string;
    savedAt: string;
    entries: CachedNetworkEntry[];
}
export declare function getCachePath(session: string, baseDir?: string): string;
export declare function saveNetworkCache(session: string, entries: CachedNetworkEntry[], baseDir?: string): void;
export interface LoadOptions {
    baseDir?: string;
    ttlMs?: number;
    now?: number;
}
export interface LoadResult {
    status: 'ok' | 'missing' | 'expired' | 'corrupt';
    file?: NetworkCacheFile;
    ageMs?: number;
}
export declare function loadNetworkCache(session: string, opts?: LoadOptions): LoadResult;
export declare function findEntry(file: NetworkCacheFile, key: string): CachedNetworkEntry | null;
