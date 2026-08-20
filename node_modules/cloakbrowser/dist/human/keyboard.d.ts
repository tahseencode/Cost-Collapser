/**
 * cloakbrowser-human — Human-like keyboard input.
 *
 * Stealth-aware: when a CDPSession is provided, shift symbols are typed
 * via CDP Input.dispatchKeyEvent (isTrusted=true, no evaluate stack trace).
 * Falls back to page.evaluate when no CDPSession is available.
 */
import type { Page, CDPSession } from 'playwright-core';
import { RawKeyboard } from './mouse.js';
import { HumanConfig } from './config.js';
/**
 * Type text with human-like per-character timing, mistype simulation,
 * and realistic shift handling.
 *
 * @param cdpSession - If provided, shift symbols use CDP Input.dispatchKeyEvent
 *   producing isTrusted=true events with no evaluate stack trace.
 *   If null/undefined, falls back to page.evaluate (detectable).
 */
export declare function humanType(page: Page, raw: RawKeyboard, text: string, cfg: HumanConfig, cdpSession?: CDPSession | null): Promise<void>;
//# sourceMappingURL=keyboard.d.ts.map