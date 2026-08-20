import { RingBuffer } from './ring-buffer.js';
import { randomBytes } from 'node:crypto';
export const DEFAULT_OBSERVATION_WINDOW_MS = 120_000;
export class ObservationSession {
    id;
    scope;
    startedAt;
    now;
    counter = 0;
    buffers;
    constructor(opts) {
        this.id = opts.id ?? createTraceId(opts.now?.() ?? Date.now());
        this.scope = opts.scope;
        this.now = opts.now ?? Date.now;
        this.startedAt = this.now();
        const bufferOpts = {
            maxAgeMs: opts.windowMs ?? DEFAULT_OBSERVATION_WINDOW_MS,
            maxItems: opts.maxEventsPerStream ?? 1_000,
            now: this.now,
        };
        this.buffers = {
            action: new RingBuffer(bufferOpts),
            network: new RingBuffer(bufferOpts),
            console: new RingBuffer(bufferOpts),
            screenshot: new RingBuffer({ ...bufferOpts, maxItems: Math.min(opts.maxEventsPerStream ?? 50, 50) }),
            state: new RingBuffer({ ...bufferOpts, maxItems: Math.min(opts.maxEventsPerStream ?? 50, 50) }),
            error: new RingBuffer(bufferOpts),
        };
    }
    record(input) {
        const event = {
            ...input,
            id: input.id ?? `${this.id}-${++this.counter}`,
            ts: input.ts ?? this.now(),
        };
        this.buffers[event.stream].push(event);
        return event;
    }
    events(opts = {}) {
        const streams = opts.stream ? [opts.stream] : Object.keys(this.buffers);
        return streams
            .flatMap((stream) => this.buffers[stream].values({ since: opts.since, until: opts.until }))
            .sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
    }
}
export function createTraceId(now = Date.now) {
    const ts = typeof now === 'function' ? now() : now;
    const rand = randomBytes(4).toString('hex');
    return `${new Date(ts).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${rand}`;
}
