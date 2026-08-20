/**
 * `browser extract` — agent-native article/content reading channel.
 *
 * Pipeline (from first principles — agents want the *content*, not the DOM):
 *   1. Scope:    select `--selector` (default: document.body or <main>/<article>)
 *   2. Denoise:  strip script/style/nav/header/footer/aside/iframe/svg/form, inline noise
 *   3. Convert:  HTML → Markdown via shared `htmlToMarkdown` (turndown)
 *   4. Chunk:    paragraph-boundary-aware slicing with `next_start_char` cursor
 *
 * Why a separate command:
 * - `get html --as json` returns tree structure; useless for "read the article".
 * - `get text` flattens everything; loses headings, lists, links.
 * - Markdown is the agent-readable middle ground: structure preserved, noise gone.
 *
 * Continuation contract: the envelope always carries `start`, `end`,
 * `total_chars`, and `next_start_char` (null when the last chunk was emitted).
 * Agents pass `--start <next>` to continue. No session state required.
 */
/**
 * Returns the JS expression string used with `page.evaluate` to produce the
 * cleaned HTML subtree that we then hand to `htmlToMarkdown`. We do the
 * denoise/clone inside the page so we can use DOM APIs (querySelectorAll,
 * cloneNode) rather than regex on serialized HTML.
 */
export declare function buildExtractHtmlJs(selector: string | null): string;
export interface ExtractChunkOptions {
    content: string;
    start: number;
    chunkSize: number;
}
export interface ExtractChunkResult {
    content: string;
    start: number;
    end: number;
    nextStartChar: number | null;
}
/**
 * Slice `content` into one chunk starting at `start` with target size
 * `chunkSize`. When the chunk would land mid-paragraph, we pull the break
 * back to the nearest `\n\n` (or `\n`) within a small window to keep the
 * output readable. If no boundary is found, we hard-cut at `start+chunkSize`.
 */
export declare function chunkMarkdown(opts: ExtractChunkOptions): ExtractChunkResult;
export interface RunExtractOptions {
    html: string;
    url: string;
    title: string;
    selector: string | null;
    start: number;
    chunkSize: number;
}
export interface RunExtractResult {
    url: string;
    title: string;
    selector: string | null;
    total_chars: number;
    chunk_size: number;
    start: number;
    end: number;
    next_start_char: number | null;
    content: string;
}
/** End-to-end host-side pipeline: HTML → markdown → chunked envelope. */
export declare function runExtractFromHtml(opts: RunExtractOptions): RunExtractResult;
export declare const __extractInternals: {
    DEFAULT_CHUNK_SIZE: number;
    MIN_CHUNK_SIZE: number;
    MAX_CHUNK_SIZE: number;
};
