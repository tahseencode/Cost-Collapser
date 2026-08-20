/**
 * Electron app launcher — auto-detect, confirm, launch, and connect.
 *
 * Flow:
 * 1. Probe CDP port → already running with debug? connect directly
 * 2. Detect process → running without CDP? prompt to restart
 * 3. Discover app path → not installed? error
 * 4. Launch with --remote-debugging-port
 * 5. Poll /json until ready
 */
import type { ElectronAppEntry } from './electron-apps.js';
/**
 * Probe whether a CDP endpoint is listening on the given port.
 * Returns true if http://127.0.0.1:{port}/json responds successfully.
 */
export declare function probeCDP(port: number, timeoutMs?: number): Promise<boolean>;
/**
 * Check if a process with the given name is running.
 * Uses pgrep on macOS/Linux.
 */
export declare function detectProcess(processName: string): boolean;
/**
 * Kill a process by name. Sends SIGTERM first, then SIGKILL after grace period.
 */
export declare function killProcess(processName: string): Promise<void>;
/**
 * Discover the app installation path on macOS.
 * Uses osascript to resolve the app name to a POSIX path.
 * Returns null if the app is not installed.
 */
export declare function discoverAppPath(displayName: string): string | null;
export declare function resolveExecutableCandidates(appPath: string, app: ElectronAppEntry): string[];
export declare function launchDetachedApp(executable: string, args: string[], label: string): Promise<void>;
export declare function launchElectronApp(appPath: string, app: ElectronAppEntry, args: string[], label: string): Promise<void>;
export declare function electronLaunchArgs(port: number, extraArgs?: string[]): string[];
/**
 * Main entry point: resolve an Electron app to a CDP endpoint URL.
 *
 * Returns the endpoint URL: http://127.0.0.1:{port}
 */
export declare function resolveElectronEndpoint(site: string): Promise<string>;
