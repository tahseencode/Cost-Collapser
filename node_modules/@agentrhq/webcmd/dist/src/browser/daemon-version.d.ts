import type { DaemonStatus } from './daemon-transport.js';
export declare function isDaemonStale(status: Pick<DaemonStatus, 'daemonVersion'> | null | undefined, cliVersion?: string): boolean;
export declare function formatDaemonVersion(status: Pick<DaemonStatus, 'daemonVersion'> | null | undefined): string;
export declare function staleDaemonIssue(status: Pick<DaemonStatus, 'daemonVersion'> | null | undefined, cliVersion: string): string;
