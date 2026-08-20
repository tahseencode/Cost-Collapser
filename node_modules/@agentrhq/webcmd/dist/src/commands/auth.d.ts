import { Command } from 'commander';
type AuthStatus = 'logged_in' | 'not_logged_in' | 'unknown' | 'error';
type AuthStatusMode = 'quick' | 'full';
type AuthRefreshStatus = 'refreshed' | 'touched' | 'not_logged_in' | 'skipped' | 'unsupported' | 'error';
export interface AuthStatusRow {
    site: string;
    status: AuthStatus;
    logged_in: boolean | '';
    identity: string;
    checked: AuthStatusMode | 'skipped';
    error: string;
}
interface AuthStatusOptions {
    sites?: string;
    only?: string;
    full?: boolean;
    concurrency?: string | number;
    timeout?: string | number;
    profile?: string;
}
export interface AuthRefreshRow {
    site: string;
    status: AuthRefreshStatus;
    last_touched_at: string;
    next_refresh_at: string;
    error: string;
}
interface AuthRefreshOptions {
    sites?: string;
    all?: boolean;
    concurrency?: string | number;
    timeout?: string | number;
    profile?: string;
    statePath?: string;
    now?: Date;
}
export declare function collectAuthStatus(options: AuthStatusOptions): Promise<AuthStatusRow[]>;
export declare function collectAuthRefresh(options: AuthRefreshOptions): Promise<AuthRefreshRow[]>;
export declare function registerAuthCommands(program: Command): Command;
export {};
