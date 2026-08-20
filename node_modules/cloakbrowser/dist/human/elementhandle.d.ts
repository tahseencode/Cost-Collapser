/**
 * ElementHandle humanization for Playwright.
 *
 * Mirrors Puppeteer's ElementHandle patching architecture.
 * Patches page.$(), page.$$(), page.waitForSelector() to return humanized handles,
 * and patches all interaction methods on each ElementHandle instance.
 *
 * Playwright ElementHandle methods patched:
 *   click, dblclick, hover, type, fill, press, selectOption,
 *   check, uncheck, setChecked, tap, focus
 *   + $, $$, waitForSelector (nested elements are also patched)
 *
 * Stealth-aware:
 *   - Uses CDP DOM.describeNode when available to check element type
 *     (no main-world JS execution)
 *   - Falls back to el.evaluate() only when CDP is unavailable
 */
import type { Page, Frame, ElementHandle } from 'playwright-core';
import type { HumanConfig } from './config.js';
import { RawMouse, RawKeyboard } from './mouse.js';
interface CursorState {
    x: number;
    y: number;
    initialized: boolean;
}
export declare function patchSingleElementHandle(el: ElementHandle, page: Page, cfg: HumanConfig, cursor: CursorState, raw: RawMouse, rawKb: RawKeyboard, originals: any, stealth: any): void;
export declare function patchPageElementHandles(page: Page, cfg: HumanConfig, cursor: CursorState, raw: RawMouse, rawKb: RawKeyboard, originals: any, stealth: any): void;
export declare function patchFrameElementHandles(frame: Frame, page: Page, cfg: HumanConfig, cursor: CursorState, raw: RawMouse, rawKb: RawKeyboard, originals: any, stealth: any): void;
export {};
//# sourceMappingURL=elementhandle.d.ts.map