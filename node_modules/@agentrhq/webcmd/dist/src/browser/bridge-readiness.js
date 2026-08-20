const DEFAULT_POLL_INTERVAL_MS = 200;
export async function waitForBridgeReady(fetchHealth, opts) {
    const interval = opts.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    let health = await fetchHealth({ contextId: opts.contextId });
    if (health.state === 'ready')
        return health;
    const deadline = Date.now() + opts.timeoutMs;
    while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        health = await fetchHealth({ contextId: opts.contextId });
        if (health.state === 'ready')
            return health;
    }
    return health;
}
export const PRE_DISPATCH_ERROR_CODES = new Set([
    'extension_not_connected',
    'profile_disconnected',
]);
export function isPreDispatchError(errorCode) {
    if (!errorCode)
        return false;
    return PRE_DISPATCH_ERROR_CODES.has(errorCode);
}
