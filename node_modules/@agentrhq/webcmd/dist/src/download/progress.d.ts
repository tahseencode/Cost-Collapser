/**
 * Download progress display: terminal progress bars, status updates.
 */
export interface ProgressBar {
    update(current: number, total: number, label?: string): void;
    complete(success: boolean, message?: string): void;
    fail(error: string): void;
}
/**
 * Format bytes as human-readable string (KB, MB, GB).
 */
export declare function formatBytes(bytes: number): string;
/**
 * Format milliseconds as human-readable duration.
 */
export declare function formatDuration(ms: number): string;
/**
 * Create a simple progress bar for terminal display.
 */
export declare function createProgressBar(filename: string, index: number, total: number): ProgressBar;
/**
 * Multi-file download progress tracker.
 */
export declare class DownloadProgressTracker {
    private completed;
    private failed;
    private skipped;
    private total;
    private startTime;
    private verbose;
    constructor(total: number, verbose?: boolean);
    onFileStart(filename: string, index: number): ProgressBar | null;
    onFileComplete(success: boolean, skipped?: boolean): void;
    getSummary(): string;
    finish(): void;
}
