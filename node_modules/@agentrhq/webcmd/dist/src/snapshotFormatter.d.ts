/**
 * Aria snapshot formatter: parses snapshot text into clean format.
 *
 * 4-pass pipeline:
 * 1. Parse & filter: strip annotations, metadata, noise, ads, boilerplate subtrees
 * 2. Deduplicate: generic/text parent match, heading+link, nested identical links
 * 3. Prune: empty containers (iterative bottom-up)
 * 4. Collapse: single-child containers
 */
import type { SnapshotOptions } from './types.js';
export declare function formatSnapshot(raw: string, opts?: SnapshotOptions): string;
