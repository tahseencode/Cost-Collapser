/**
 * cloakbrowser-human — Human-like keyboard input.
 * Adapted for Puppeteer API.
 *
 * Changes from Playwright version:
 *   - Uses puppeteer-core Page/CDPSession types
 *   - keyboard.sendCharacter() mapped via RawKeyboard.insertText adapter
 *   - CDPSession obtained via page.createCDPSession()
 *
 * Stealth-aware: shift symbols use CDP Input.dispatchKeyEvent (isTrusted=true).
 */
import type { Page, CDPSession } from 'puppeteer-core';
import { RawKeyboard } from '../human/mouse.js';
import type { HumanConfig } from '../human/config.js';
export declare function humanType(page: Page, raw: RawKeyboard, text: string, cfg: HumanConfig, cdpSession?: CDPSession | null): Promise<void>;
//# sourceMappingURL=keyboard.d.ts.map