export interface CommandValidationResult {
    /** Display label: "site/name" or source path if available */
    label: string;
    errors: string[];
    warnings: string[];
}
export interface ValidationReport {
    ok: boolean;
    results: CommandValidationResult[];
    errors: number;
    warnings: number;
    commands: number;
}
/**
 * Validate registered CLI commands from the in-memory registry.
 *
 * The `_dirs` parameter is kept for call-site compatibility but is no longer
 * used — validation now operates on the registry populated by `discoverClis()`.
 */
export declare function validateClisWithTarget(_dirs: string[], target?: string): ValidationReport;
export declare function renderValidationReport(report: ValidationReport): string;
