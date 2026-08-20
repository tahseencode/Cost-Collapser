export interface RingBufferOptions {
    maxAgeMs?: number;
    maxItems?: number;
    now?: () => number;
}
export declare class RingBuffer<T extends {
    ts: number;
}> {
    private readonly maxAgeMs;
    private readonly maxItems;
    private readonly now;
    private items;
    constructor(opts?: RingBufferOptions);
    push(item: T): void;
    values(opts?: {
        since?: number;
        until?: number;
    }): T[];
    clear(): void;
    get size(): number;
    private prune;
}
