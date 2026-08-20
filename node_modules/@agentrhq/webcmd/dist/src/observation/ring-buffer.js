export class RingBuffer {
    maxAgeMs;
    maxItems;
    now;
    items = [];
    constructor(opts = {}) {
        this.maxAgeMs = opts.maxAgeMs ?? 120_000;
        this.maxItems = opts.maxItems ?? 1_000;
        this.now = opts.now ?? Date.now;
    }
    push(item) {
        this.items.push(item);
        this.prune();
    }
    values(opts = {}) {
        this.prune();
        return this.items.filter((item) => {
            if (opts.since !== undefined && item.ts < opts.since)
                return false;
            if (opts.until !== undefined && item.ts > opts.until)
                return false;
            return true;
        });
    }
    clear() {
        this.items = [];
    }
    get size() {
        this.prune();
        return this.items.length;
    }
    prune() {
        const minTs = this.now() - this.maxAgeMs;
        if (this.items.length > this.maxItems) {
            this.items = this.items.slice(this.items.length - this.maxItems);
        }
        if (this.maxAgeMs > 0) {
            const firstKept = this.items.findIndex((item) => item.ts >= minTs);
            if (firstKept > 0)
                this.items = this.items.slice(firstKept);
            else if (firstKept === -1)
                this.items = [];
        }
    }
}
