import { type Dispatcher } from 'undici';
export interface ProxyDecision {
    mode: 'direct' | 'proxy';
    proxyUrl?: string;
}
export declare function hasProxyEnv(env?: NodeJS.ProcessEnv): boolean;
export declare function decideProxy(url: URL, env?: NodeJS.ProcessEnv): ProxyDecision;
export declare function getDispatcherForUrl(url: URL, env?: NodeJS.ProcessEnv): Dispatcher;
export declare function fetchWithNodeNetwork(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
export declare function installNodeNetwork(): void;
