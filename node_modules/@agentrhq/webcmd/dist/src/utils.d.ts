/**
 * Shared utility functions used across the codebase.
 */
import TurndownService from 'turndown';
/** Type guard: checks if a value is a non-null, non-array object. */
export declare function isRecord(value: unknown): value is Record<string, unknown>;
/** Simple async concurrency limiter. */
export declare function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
/** Pause for the given number of milliseconds. */
export declare function sleep(ms: number): Promise<void>;
/** Save a base64-encoded string to a file, creating parent directories as needed. */
export declare function saveBase64ToFile(base64: string, filePath: string): Promise<void>;
export declare function createMarkdownConverter(configure?: (td: TurndownService) => void): TurndownService;
export declare function htmlToMarkdown(value: string, configure?: (td: TurndownService) => void): string;
/** Sentinel shape that browser-side `fetch` wrappers return when they detect an
 * HTML response in place of JSON. Kept as a plain object so it survives the
 * `page.evaluate` JSON round-trip. */
export interface LoginWallSignal {
    __loginWall: true;
    status: number;
    url: string;
    contentType: string;
    bodyPreview: string;
}
/** Throw a `LoginWallError` if `value` is the sentinel returned by the
 * browser-side sniffer; otherwise return `value` unchanged. Adapters that
 * fetch from inside `page.evaluate` call this on the result before consuming
 * it, so the Node-side gets a typed error instead of a JSON-parse stack
 * trace. */
export declare function throwIfLoginWall<T>(value: T, opts?: {
    url?: string;
}): T;
/** Parse a `Response` body as JSON, throwing `LoginWallError` if the server
 * returned an HTML page (login wall / rate limit / WAF interception) instead
 * of the expected JSON. Catches the common case of `<!DOCTYPE` or `<html`
 * leading the body \u2014 naive `JSON.parse` on these gives a cryptic
 * `SyntaxError` that callers can't distinguish from "real" malformed JSON.
 *
 * On real (non-HTML) JSON-parse failures, throws a regular `Error` with a
 * body preview attached so debugging doesn't require a packet capture. */
export declare function parseJsonOrThrowLoginWall(response: Response, opts?: {
    url?: string;
}): Promise<unknown>;
/** Browser-side JS source fragment (as a string) that performs a `fetch` and
 * either returns the parsed JSON body or a `LoginWallSignal` sentinel when
 * the response is HTML. Intended to be embedded inside an adapter's
 * `page.evaluate` block.
 *
 * Usage from inside a `page.evaluate` IIFE:
 *
 *     ${BROWSER_JSON_SNIFF_FN}
 *     const res = await fetchJsonOrLoginWall('/some/path.json', { credentials: 'include' });
 *     // res is the parsed JSON object, OR { __loginWall: true, status, url, contentType, bodyPreview }
 *     return res;
 *
 * The Node side then calls `throwIfLoginWall(res, { url })` on the result. */
export declare const BROWSER_JSON_SNIFF_FN = "\nasync function fetchJsonOrLoginWall(input, init) {\n  const r = await fetch(input, init);\n  const contentType = r.headers.get('content-type') || '';\n  const text = await r.text();\n  const trimmed = text.replace(/^\\s+/, '');\n  const looksLikeHtml =\n    contentType.toLowerCase().includes('text/html')\n    || /^<(?:!doctype|html|head|body|title)(?:[\\s>/]|$)/i.test(trimmed);\n  if (looksLikeHtml) {\n    return {\n      __loginWall: true,\n      status: r.status,\n      url: r.url || (typeof input === 'string' ? input : ''),\n      contentType,\n      bodyPreview: trimmed.slice(0, 100),\n    };\n  }\n  if (!r.ok) {\n    return { error: r.status };\n  }\n  try {\n    return JSON.parse(text);\n  } catch (err) {\n    throw new Error(\n      'JSON parse failed (status=' + r.status + ', body[0..50]=' + JSON.stringify(trimmed.slice(0, 50)) + '): '\n      + (err && err.message ? err.message : String(err))\n    );\n  }\n}\n";
