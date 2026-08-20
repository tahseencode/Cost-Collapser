/**
 * JSON shape inference for browser network response previews.
 *
 * Produces a flat path → type descriptor map so agents can understand
 * response structure without paying the token cost of the full body.
 *
 * Descriptors:
 *   string | number | boolean | null              primitives
 *   string(len=N)                                 strings longer than sampleStringLen
 *   array(0) | array(N)                           array at depth cap or summarized
 *   object | object(empty)                        objects at depth cap or summarized
 *   (truncated)                                   output size budget exceeded
 */
export interface InferShapeOptions {
    /** Max path depth to descend into (default 6) */
    maxDepth?: number;
    /** Byte budget for the serialized output; truncates when exceeded (default 2048) */
    maxBytes?: number;
    /** Strings longer than this get summarized as `string(len=N)` (default 80) */
    sampleStringLen?: number;
}
export type Shape = Record<string, string>;
export declare function inferShape(value: unknown, opts?: InferShapeOptions): Shape;
