/**
 * Browser tab management helpers: extract, diff, and cleanup tab state.
 */
export declare function extractTabEntries(raw: unknown): Array<{
    index: number;
    identity: string;
}>;
export declare function extractTabIdentities(raw: unknown): string[];
export declare function diffTabIndexes(initialIdentities: string[], currentTabs: Array<{
    index: number;
    identity: string;
}>): number[];
export declare function appendLimited(current: string, chunk: string, limit: number): string;
