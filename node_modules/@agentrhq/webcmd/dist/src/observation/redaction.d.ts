export interface RedactionOptions {
    allowlist?: string[];
    maxStringLength?: number;
    maxDepth?: number;
    maxArrayItems?: number;
    maxObjectFields?: number;
}
export declare function redactUrl(url: string): string;
export declare function redactHeaders(headers: Record<string, unknown> | undefined, opts?: RedactionOptions): Record<string, unknown> | undefined;
export declare function redactText(text: string, opts?: RedactionOptions): string;
export declare function redactValue(value: unknown, opts?: RedactionOptions, keyHint?: string, depth?: number): unknown;
