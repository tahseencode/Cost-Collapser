/**
 * GeoIP-based timezone and locale detection from proxy IP.
 *
 * Optional feature — requires `mmdb-lib` package:
 *   npm install mmdb-lib
 *
 * Downloads GeoLite2-City.mmdb (~70 MB) on first use,
 * caches in `~/.cloakbrowser/geoip/`.
 */
import type { LaunchOptions } from "./types.js";
/** Country ISO code → BCP 47 locale (covers ~90% of proxy traffic). */
export declare const COUNTRY_LOCALE_MAP: Record<string, string>;
export interface GeoResult {
    timezone: string | null;
    locale: string | null;
    exitIp: string | null;
}
/**
 * Resolve timezone and locale from a proxy's IP address.
 * Returns `{ timezone, locale }` — either may be null on failure.
 * Never throws.
 */
export declare function resolveProxyGeo(proxyUrl: string): Promise<GeoResult>;
/** @internal Exported for testing. */
export declare function resolveProxyIp(proxyUrl: string): Promise<string | null>;
/**
 * Auto-fill timezone/locale from proxy IP when geoip is enabled.
 * Also returns exitIp as a free bonus (reused for WebRTC spoofing).
 */
export declare function maybeResolveGeoip(options: LaunchOptions): Promise<{
    timezone?: string;
    locale?: string;
    exitIp?: string;
}>;
/**
 * Replace --fingerprint-webrtc-ip=auto with the resolved proxy exit IP.
 * Returns args unchanged if no ``auto`` value is present.
 */
export declare function resolveWebrtcArgs(options: LaunchOptions): Promise<string[] | undefined>;
//# sourceMappingURL=geoip.d.ts.map