/**
 * Pipeline template engine: ${{ ... }} expression rendering.
 */
export interface RenderContext {
    args?: Record<string, unknown>;
    data?: unknown;
    root?: unknown;
    item?: unknown;
    index?: number;
}
export declare function render(template: unknown, ctx: RenderContext): unknown;
export declare function evalExpr(expr: string, ctx: RenderContext): unknown;
export declare function resolvePath(pathStr: string, ctx: RenderContext): unknown;
/**
 * Normalize JavaScript source for browser evaluate() calls.
 */
export declare function normalizeEvaluateSource(source: string): string;
