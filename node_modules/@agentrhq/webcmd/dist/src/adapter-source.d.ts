import type { InternalCliCommand } from './registry.js';
/**
 * Resolve the editable source file path for an adapter.
 *
 * Priority:
 * 1. cmd.source (set for FS-scanned JS and manifest lazy-loaded JS)
 * 2. cmd._modulePath (set for manifest lazy-loaded JS)
 *
 * Skip manifest: prefixed pseudo-paths (YAML commands inlined in manifest).
 */
export declare function resolveAdapterSourcePath(cmd: InternalCliCommand): string | undefined;
