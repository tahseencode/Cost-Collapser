import type { ObservationExportResult, ObservationExportStatus, ObservationTraceReceipt } from './events.js';
import { ObservationSession } from './session.js';
import { type TraceRetentionPolicyInput } from './retention.js';
export interface ExportObservationOptions {
    baseDir?: string;
    error?: unknown;
    status?: ObservationExportStatus;
    retentionPolicy?: TraceRetentionPolicyInput;
}
export declare function getTraceDirectory(contextId: string | undefined, traceId: string, baseDir?: string): string;
export declare function exportObservationSession(session: ObservationSession, opts?: ExportObservationOptions): ObservationExportResult;
export declare function buildTraceReceipt(result: Pick<ObservationExportResult, 'traceId' | 'dir' | 'summaryPath' | 'receiptPath'>, status: ObservationExportStatus, error?: unknown, opts?: {
    createdAt?: string;
    scope?: ObservationSession['scope'];
    retentionPolicy?: TraceRetentionPolicyInput;
}): ObservationTraceReceipt;
