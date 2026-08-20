/**
 * AX-backed browser snapshot prototype.
 *
 * This is intentionally additive to the current DOM snapshot. It learns from
 * agent-browser's accessibility-tree refs without changing default `state`
 * output until the AX path proves itself on fixtures and real SaaS workflows.
 */
export interface BrowserRef {
    ref: string;
    backendNodeId?: number;
    role: string;
    name: string;
    nth?: number;
    frame?: {
        frameId?: string;
        sessionId?: string;
        url?: string;
        targetUrl?: string;
    };
}
export interface AxSnapshotTree {
    tree: unknown;
    frame?: BrowserRef['frame'];
}
export interface AxSnapshotBuildResult {
    text: string;
    refs: Map<string, BrowserRef>;
}
export declare function buildAxSnapshot(axTree: unknown, opts?: {
    maxDepth?: number;
    interactiveOnly?: boolean;
}): AxSnapshotBuildResult;
export declare function buildAxSnapshotFromTrees(trees: AxSnapshotTree[], opts?: {
    maxDepth?: number;
    interactiveOnly?: boolean;
}): AxSnapshotBuildResult;
export declare function findAxRefReplacement(axTree: unknown, ref: BrowserRef): BrowserRef | null;
