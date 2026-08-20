export interface CheckboxItem {
    label: string;
    value: string;
    checked: boolean;
    /** Optional status to display after the label */
    status?: string;
}
/**
 * Interactive multi-select checkbox prompt.
 *
 * Controls:
 *   ↑/↓ or j/k  — navigate
 *   Space        — toggle selection
 *   a            — toggle all
 *   Enter        — confirm
 *   q/Esc        — cancel (returns empty)
 */
export declare function checkboxPrompt(items: CheckboxItem[], opts?: {
    title?: string;
    hint?: string;
}): Promise<string[]>;
/**
 * Simple yes/no confirmation prompt.
 *
 * In non-TTY environments, returns `defaultYes` (defaults to true) without blocking.
 * In TTY, waits for a single keypress: y/Enter → true, n/Esc/q → false.
 */
export declare function confirmPrompt(message: string, defaultYes?: boolean): Promise<boolean>;
