export type ConventionRuleId = 'silent-column-drop' | 'camelCase-in-columns' | 'missing-access-metadata' | 'silent-clamp' | 'silent-empty-fallback' | 'silent-sentinel' | 'write-without-delete-pair';
type ManifestArg = {
    name?: string;
    positional?: boolean;
    required?: boolean;
    help?: string;
};
export type ManifestCommand = {
    site?: string;
    name?: string;
    access?: string;
    args?: ManifestArg[];
    columns?: string[];
    modulePath?: string;
    sourceFile?: string;
};
export type ConventionViolation = {
    rule: ConventionRuleId;
    site: string;
    name: string;
    command: string;
    message: string;
    file?: string;
    line?: number;
    details?: Record<string, unknown>;
};
export type ConventionCategory = {
    rule: ConventionRuleId;
    count: number;
    violations: ConventionViolation[];
};
export type ConventionAuditReport = {
    ok: boolean;
    summary: {
        commands: number;
        sites: number;
        files_scanned: number;
        violations: number;
    };
    categories: ConventionCategory[];
};
export type ConventionAuditOptions = {
    projectRoot: string;
    manifestPath?: string;
    target?: string;
    site?: string;
};
export declare function runConventionAudit(opts: ConventionAuditOptions): ConventionAuditReport;
export declare function renderConventionAuditText(report: ConventionAuditReport): string;
export {};
