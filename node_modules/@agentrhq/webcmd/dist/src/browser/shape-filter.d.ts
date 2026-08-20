/**
 * Shape-based field filter for `browser network --filter <fields>`.
 *
 * Agents know what fields a target request's body should contain
 * (e.g. "author, text, likes") but not which of the captured requests
 * carries that body. This module lets the network command filter
 * entries down to those whose inferred shape exposes every requested
 * field name as some path segment.
 *
 * Matching is "any-segment" (not last-segment-only): a field matches
 * if it equals any segment name of any path in the shape map. This
 * keeps nested-container fields (e.g. `legacy`, `author` used as an
 * object key with further nesting) findable.
 */
import type { Shape } from './shape.js';
export interface ParsedFilter {
    /** Deduped, order-preserving, trimmed non-empty field names. */
    fields: string[];
}
export interface FilterParseError {
    /** `invalid_filter` structured error reason for agents. */
    reason: string;
}
/**
 * Parse `--filter` argument value. Splits on `,`, trims, drops empties,
 * and dedupes (first-seen wins). Returns `FilterParseError` when the
 * result is empty after cleaning — which means the caller passed only
 * whitespace, commas, or an empty string.
 */
export declare function parseFilter(raw: string): ParsedFilter | FilterParseError;
/**
 * Extract named segments from a shape path. Drops the leading `$`,
 * strips `[N]` array indices, and unwraps `["key"]` bracket-quoted
 * keys back to their raw string.
 *
 * Examples:
 *   `$`                              → []
 *   `$.data.items[0].author`         → ['data','items','author']
 *   `$.data.user["nick name"]`       → ['data','user','nick name']
 *   `$.rows[0][1]`                   → ['rows']
 */
export declare function extractSegments(path: string): string[];
/**
 * Collect the set of segment names used anywhere in a shape map.
 * The returned set is what we test field membership against.
 */
export declare function collectShapeSegments(shape: Shape): Set<string>;
/**
 * True iff every field in `fields` equals some segment name in `shape`.
 * AND semantics: all fields must be present.
 */
export declare function shapeMatchesFilter(shape: Shape, fields: string[]): boolean;
