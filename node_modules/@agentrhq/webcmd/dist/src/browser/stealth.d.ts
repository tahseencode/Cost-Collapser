/**
 * Stealth anti-detection module.
 *
 * Generates JS code that patches browser globals to hide automation
 * fingerprints (e.g. navigator.webdriver, missing chrome object, empty
 * plugin list). Injected before page scripts run so that websites cannot
 * detect CDP / extension-based control.
 *
 * Inspired by puppeteer-extra-plugin-stealth.
 */
export declare function generateStealthJs(): string;
