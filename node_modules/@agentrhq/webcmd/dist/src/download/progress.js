/**
 * Download progress display: terminal progress bars, status updates.
 */
/**
 * Format bytes as human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 1)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
/**
 * Format milliseconds as human-readable duration.
 */
export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
/**
 * Create a simple progress bar for terminal display.
 */
export function createProgressBar(filename, index, total) {
    const prefix = `[${index + 1}/${total}]`;
    const truncatedName = filename.length > 40 ? filename.slice(0, 37) + '...' : filename;
    return {
        update(current, totalBytes, label) {
            const percent = clampPercent(totalBytes > 0 ? Math.round((current / totalBytes) * 100) : 0);
            const bar = createBar(percent);
            const size = totalBytes > 0 ? formatBytes(totalBytes) : '';
            const extra = label ? ` ${label}` : '';
            process.stderr.write(`\r${prefix} ${truncatedName} ${bar} ${percent}% ${size}${extra}`);
        },
        complete(success, message) {
            const icon = success ? '✓' : '✗';
            const msg = message ? ` ${message}` : '';
            process.stderr.write(`\r${prefix} ${icon} ${truncatedName}${msg}\n`);
        },
        fail(error) {
            process.stderr.write(`\r${prefix} ✗ ${truncatedName} ${error}\n`);
        },
    };
}
function clampPercent(percent) {
    if (!Number.isFinite(percent))
        return 0;
    return Math.max(0, Math.min(100, percent));
}
/**
 * Create a progress bar string.
 */
function createBar(percent, width = 20) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
/**
 * Multi-file download progress tracker.
 */
export class DownloadProgressTracker {
    completed = 0;
    failed = 0;
    skipped = 0;
    total;
    startTime;
    verbose;
    constructor(total, verbose = true) {
        this.total = total;
        this.startTime = Date.now();
        this.verbose = verbose;
    }
    onFileStart(filename, index) {
        if (!this.verbose)
            return null;
        return createProgressBar(filename, index, this.total);
    }
    onFileComplete(success, skipped = false) {
        if (skipped) {
            this.skipped++;
        }
        else if (success) {
            this.completed++;
        }
        else {
            this.failed++;
        }
    }
    getSummary() {
        const elapsed = formatDuration(Date.now() - this.startTime);
        const parts = [];
        if (this.completed > 0) {
            parts.push(`${this.completed} downloaded`);
        }
        if (this.skipped > 0) {
            parts.push(`${this.skipped} skipped`);
        }
        if (this.failed > 0) {
            parts.push(`${this.failed} failed`);
        }
        return `${parts.join(', ')} in ${elapsed}`;
    }
    finish() {
        if (this.verbose) {
            process.stderr.write(`\nDownload complete: ${this.getSummary()}\n`);
        }
    }
}
