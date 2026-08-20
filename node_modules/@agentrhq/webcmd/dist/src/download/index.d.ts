/**
 * Download utilities: HTTP downloads, yt-dlp wrapper, format conversion.
 */
import type { BrowserCookie } from '../types.js';
export type { BrowserCookie } from '../types.js';
export interface DownloadOptions {
    cookies?: string;
    headers?: Record<string, string>;
    timeout?: number;
    onProgress?: (received: number, total: number) => void;
    maxRedirects?: number;
}
export interface YtdlpOptions {
    cookies?: string;
    cookiesFile?: string;
    format?: string;
    extraArgs?: string[];
    onProgress?: (percent: number) => void;
}
/** Check if yt-dlp is available in PATH. */
export declare function checkYtdlp(): boolean;
/**
 * Detect content type from URL and optional headers.
 */
export declare function detectContentType(url: string, contentType?: string): 'image' | 'video' | 'document' | 'binary';
/**
 * Check if URL requires yt-dlp for download.
 */
export declare function requiresYtdlp(url: string): boolean;
/**
 * HTTP download with progress callback.
 */
export declare function httpDownload(url: string, destPath: string, options?: DownloadOptions, redirectCount?: number): Promise<{
    success: boolean;
    size: number;
    error?: string;
}>;
export declare function resolveRedirectUrl(currentUrl: string, location: string): string;
/**
 * Export cookies to Netscape format for yt-dlp.
 */
export declare function exportCookiesToNetscape(cookies: BrowserCookie[], filePath: string): void;
export declare function formatCookieHeader(cookies: BrowserCookie[]): string;
/**
 * Download video using yt-dlp.
 */
export declare function ytdlpDownload(url: string, destPath: string, options?: YtdlpOptions): Promise<{
    success: boolean;
    size: number;
    error?: string;
}>;
/**
 * Save document content to file.
 */
export declare function saveDocument(content: string, destPath: string, format?: 'json' | 'markdown' | 'html' | 'text', metadata?: Record<string, unknown>): Promise<{
    success: boolean;
    size: number;
    error?: string;
}>;
/**
 * Sanitize filename by removing invalid characters.
 */
export declare function sanitizeFilename(name: string, maxLength?: number): string;
/**
 * Generate filename from URL if not provided.
 */
export declare function generateFilename(url: string, index: number, extension?: string): string;
/**
 * Get temp directory for cookie files.
 */
export declare function getTempDir(): string;
