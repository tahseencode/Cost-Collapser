import * as fs from 'node:fs';
import * as path from 'node:path';
import { log } from '../logger.js';
export const DEFAULT_TRACE_RETENTION_POLICY = {
    maxAgeDays: 7,
    maxCountPerProfile: 20,
    maxBytesPerProfile: '500MB',
};
const BYTES_UNITS = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
};
export function parseByteSize(value) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0)
            throw new Error(`Invalid byte size: ${value}`);
        return Math.floor(value);
    }
    const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
    if (!match)
        throw new Error(`Invalid byte size: ${value}`);
    const amount = Number(match[1]);
    const unit = (match[2] ?? 'B').toUpperCase();
    return Math.floor(amount * BYTES_UNITS[unit]);
}
export function resolveTraceRetentionPolicy(input = {}) {
    const maxAgeDays = input.maxAgeDays ?? DEFAULT_TRACE_RETENTION_POLICY.maxAgeDays;
    const maxCountPerProfile = input.maxCountPerProfile ?? DEFAULT_TRACE_RETENTION_POLICY.maxCountPerProfile;
    if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0)
        throw new Error(`Invalid trace maxAgeDays: ${maxAgeDays}`);
    if (!Number.isInteger(maxCountPerProfile) || maxCountPerProfile < 0) {
        throw new Error(`Invalid trace maxCountPerProfile: ${maxCountPerProfile}`);
    }
    return {
        maxAgeDays,
        maxAgeMs: maxAgeDays * 24 * 60 * 60 * 1000,
        maxCountPerProfile,
        maxBytesPerProfile: parseByteSize(input.maxBytesPerProfile ?? DEFAULT_TRACE_RETENTION_POLICY.maxBytesPerProfile),
    };
}
export function traceExpiresAt(createdAt, policyInput = {}) {
    const policy = resolveTraceRetentionPolicy(policyInput);
    const createdAtMs = Date.parse(createdAt);
    const base = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
    return new Date(base + policy.maxAgeMs).toISOString();
}
export function pruneTraceArtifacts(tracesDir, opts = {}) {
    const warn = opts.warn ?? ((message) => log.warn(`[trace] ${message}`));
    const policy = resolveTraceRetentionPolicy(opts.policy);
    const now = opts.now ?? Date.now;
    const protectedDirs = new Set((opts.protectedTraceDirs ?? []).map((dir) => path.resolve(dir)));
    const entries = readTraceEntries(tracesDir, protectedDirs, warn);
    const totalBytesBefore = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0);
    const deleted = new Set();
    const sorted = [...entries].sort((a, b) => a.createdAtMs - b.createdAtMs || a.dir.localeCompare(b.dir));
    const cutoff = now() - policy.maxAgeMs;
    for (const entry of sorted) {
        if (!entry.protected && entry.createdAtMs < cutoff)
            deleted.add(entry.dir);
    }
    let remaining = sorted.filter((entry) => !deleted.has(entry.dir));
    while (remaining.length > policy.maxCountPerProfile) {
        const victim = remaining.find((entry) => !entry.protected);
        if (!victim)
            break;
        deleted.add(victim.dir);
        remaining = remaining.filter((entry) => entry.dir !== victim.dir);
    }
    let remainingBytes = remaining.reduce((sum, entry) => sum + entry.sizeBytes, 0);
    while (remainingBytes > policy.maxBytesPerProfile) {
        const victim = remaining.find((entry) => !entry.protected);
        if (!victim)
            break;
        deleted.add(victim.dir);
        remaining = remaining.filter((entry) => entry.dir !== victim.dir);
        remainingBytes -= victim.sizeBytes;
    }
    const deletedDirs = [];
    for (const dir of sorted.map((entry) => entry.dir).filter((dir) => deleted.has(dir))) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            deletedDirs.push(dir);
        }
        catch (err) {
            warn(`Failed to prune trace artifact ${dir}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    const keptEntries = entries.filter((entry) => !deletedDirs.includes(entry.dir));
    return {
        scanned: entries.length,
        deleted: deletedDirs,
        kept: keptEntries.map((entry) => entry.dir),
        totalBytesBefore,
        totalBytesAfter: keptEntries.reduce((sum, entry) => sum + entry.sizeBytes, 0),
    };
}
function readTraceEntries(tracesDir, protectedDirs, warn) {
    let names;
    try {
        names = fs.readdirSync(tracesDir);
    }
    catch (err) {
        if (isEnoent(err))
            return [];
        warn(`Failed to list trace artifacts in ${tracesDir}: ${err instanceof Error ? err.message : String(err)}`);
        return [];
    }
    const entries = [];
    for (const name of names) {
        const dir = path.join(tracesDir, name);
        try {
            const stat = fs.statSync(dir);
            if (!stat.isDirectory())
                continue;
            entries.push({
                dir,
                createdAtMs: readCreatedAtMs(dir, stat.mtimeMs),
                sizeBytes: directorySize(dir),
                protected: protectedDirs.has(path.resolve(dir)),
            });
        }
        catch (err) {
            if (!isEnoent(err)) {
                warn(`Failed to inspect trace artifact ${dir}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    return entries;
}
function readCreatedAtMs(dir, fallbackMs) {
    try {
        const receipt = JSON.parse(fs.readFileSync(path.join(dir, 'receipt.json'), 'utf-8'));
        if (typeof receipt.createdAt === 'string') {
            const parsed = Date.parse(receipt.createdAt);
            if (Number.isFinite(parsed))
                return parsed;
        }
    }
    catch {
        // Older or hand-edited trace directories may not have a receipt.
    }
    return fallbackMs;
}
function directorySize(dir) {
    let total = 0;
    for (const name of fs.readdirSync(dir)) {
        const item = path.join(dir, name);
        const stat = fs.lstatSync(item);
        if (stat.isDirectory())
            total += directorySize(item);
        else
            total += stat.size;
    }
    return total;
}
function isEnoent(err) {
    return typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT';
}
