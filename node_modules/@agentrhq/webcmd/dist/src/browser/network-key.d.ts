/**
 * Stable keys for network capture entries.
 *
 * Agents reference entries by key (e.g. `UserTweets`, `GET api.x.com/1.1/home`)
 * instead of array index, so the mapping survives new captures.
 *
 * Rules:
 *   GraphQL (URL contains `/graphql/`): key = operationName derived from URL path
 *                                       (the segment after a 22-char query id, or the last segment)
 *   Everything else: key = `METHOD host+pathname`
 *
 * On collision assignKeys suffixes duplicates as `base#2`, `base#3`, ... —
 * the first occurrence stays bare (there is no `#1`).
 */
export interface KeyableRequest {
    url: string;
    method: string;
}
export declare function deriveKey(req: KeyableRequest): string;
export declare function assignKeys<T extends KeyableRequest>(requests: T[]): Array<T & {
    key: string;
}>;
