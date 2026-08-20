import type { LaunchOptions } from "./types.js";
/**
 * Build deduplicated Chromium CLI args from stealth defaults + user overrides.
 *
 * Priority: stealth defaults < user args < dedicated params (timezone/locale).
 */
export declare function buildArgs(options: LaunchOptions): string[];
//# sourceMappingURL=args.d.ts.map