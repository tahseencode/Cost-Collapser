import type { ObservationEvent, ObservationEventInput, ObservationScope, ObservationStream } from './events.js';
export declare const DEFAULT_OBSERVATION_WINDOW_MS = 120000;
export interface ObservationSessionOptions {
    id?: string;
    scope: ObservationScope;
    windowMs?: number;
    maxEventsPerStream?: number;
    now?: () => number;
}
export declare class ObservationSession {
    readonly id: string;
    readonly scope: ObservationScope;
    readonly startedAt: number;
    private readonly now;
    private counter;
    private readonly buffers;
    constructor(opts: ObservationSessionOptions);
    record(input: ObservationEventInput): ObservationEvent;
    events(opts?: {
        stream?: ObservationStream;
        since?: number;
        until?: number;
    }): ObservationEvent[];
}
export declare function createTraceId(now?: number | (() => number)): string;
