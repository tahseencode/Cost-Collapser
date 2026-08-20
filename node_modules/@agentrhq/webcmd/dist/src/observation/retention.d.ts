export interface TraceRetentionPolicyInput {
    maxAgeDays?: number;
    maxCountPerProfile?: number;
    maxBytesPerProfile?: string | number;
}
export interface ResolvedTraceRetentionPolicy {
    maxAgeDays: number;
    maxAgeMs: number;
    maxCountPerProfile: number;
    maxBytesPerProfile: number;
}
export interface TraceRetentionPruneResult {
    scanned: number;
    deleted: string[];
    kept: string[];
    totalBytesBefore: number;
    totalBytesAfter: number;
}
export declare const DEFAULT_TRACE_RETENTION_POLICY: {
    maxAgeDays: number;
    maxCountPerProfile: number;
    maxBytesPerProfile: string;
};
export declare function parseByteSize(value: string | number): number;
export declare function resolveTraceRetentionPolicy(input?: TraceRetentionPolicyInput): ResolvedTraceRetentionPolicy;
export declare function traceExpiresAt(createdAt: string, policyInput?: TraceRetentionPolicyInput): string;
export declare function pruneTraceArtifacts(tracesDir: string, opts?: {
    policy?: TraceRetentionPolicyInput;
    protectedTraceDirs?: string[];
    now?: () => number;
    warn?: (message: string) => void;
}): TraceRetentionPruneResult;
