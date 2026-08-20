/**
 * Client-side HTML → structured tree serializer.
 *
 * Returned as a JS string that gets passed to `page.evaluate`. The expression
 * walks the DOM subtree rooted at the first selector match (or documentElement
 * when no selector is given) and emits a compact `{tag, attrs, text, children}`
 * tree for agents to consume instead of re-parsing raw HTML.
 *
 * Text handling: `text` is the concatenated text of direct text children only,
 * whitespace-collapsed. Nested element text is left inside `children[].text`.
 * Ordering between text and elements is not preserved — agents that need it
 * should fall back to raw HTML mode.
 *
 * Budget knobs let the caller bound the output on large pages — previously an
 * unscoped `get html --as json` could return a giant tree. Callers set any
 * combination of `depth` / `childrenMax` / `textMax`; each hit is reported in
 * the `truncated` envelope so agents know to narrow their selector or raise
 * the budget.
 *
 * Compound controls (date / time / datetime-local / month / week / select /
 * file) gain a `compound` field so agents inspecting the JSON tree see the
 * full contract — date format, full option list (up to cap) with selections
 * preserved for options beyond the cap, file `accept` and `multiple`. Without
 * this wiring agents repeatedly guess values on these controls from the raw
 * attributes, which is the failure mode compound.ts was built to eliminate.
 */
import { type CompoundInfo } from './compound.js';
export interface BuildHtmlTreeJsOptions {
    /** CSS selector to scope the tree; unscoped = documentElement */
    selector?: string | null;
    /** Max depth below the root (0 = root only, no children). Omit = unlimited. */
    depth?: number | null;
    /** Max element children per node before the rest get dropped. Omit = unlimited. */
    childrenMax?: number | null;
    /** Max chars of direct text per node before truncation. Omit = unlimited. */
    textMax?: number | null;
}
/**
 * Returns a JS expression string. When evaluated in a page context the
 * expression resolves to either
 *   `{selector, matched, tree, truncated}` on success, or
 *   `{selector, invalidSelector: true, reason}` when `querySelectorAll`
 *   throws a `SyntaxError` for an unparseable selector.
 *
 * Callers must branch on `invalidSelector` to convert it into the CLI's
 * `invalid_selector` structured error; otherwise the browser-level exception
 * would bubble out of `page.evaluate` and bypass the structured-error
 * contract that agents rely on.
 */
export declare function buildHtmlTreeJs(opts?: BuildHtmlTreeJsOptions): string;
export interface HtmlNode {
    tag: string;
    attrs: Record<string, string>;
    text: string;
    children: HtmlNode[];
    /**
     * Rich view for date/select/file controls. Omitted for non-compound elements
     * so agents can rely on `compound != null` as a signal.
     */
    compound?: CompoundInfo;
}
export interface HtmlTreeTruncationInfo {
    /** At least one element child was dropped because depth budget was hit. */
    depth?: true;
    /** Count of element children dropped across the tree due to `childrenMax`. */
    children_dropped?: number;
    /** Count of nodes whose `text` was cut to `textMax`. */
    text_truncated?: number;
}
export interface HtmlTreeResult {
    selector: string | null;
    matched: number;
    tree: HtmlNode | null;
    truncated?: HtmlTreeTruncationInfo;
}
