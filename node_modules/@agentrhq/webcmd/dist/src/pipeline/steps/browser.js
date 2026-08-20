/**
 * Pipeline step: navigate, click, type, wait, press, snapshot.
 * Browser interaction primitives.
 */
import { render } from '../template.js';
import { isRecord } from '../../utils.js';
export async function stepNavigate(page, params, data, args) {
    if (isRecord(params) && 'url' in params) {
        const url = String(render(params.url, { args, data }));
        await page.goto(url, { waitUntil: params.waitUntil, settleMs: typeof params.settleMs === 'number' ? params.settleMs : undefined });
    }
    else {
        const url = render(params, { args, data });
        await page.goto(String(url));
    }
    return data;
}
export async function stepClick(page, params, data, args) {
    await page.click(String(render(params, { args, data })).replace(/^@/, ''));
    return data;
}
export async function stepType(page, params, data, args) {
    if (isRecord(params)) {
        const ref = String(render(params.ref ?? '', { args, data })).replace(/^@/, '');
        const text = String(render(params.text ?? '', { args, data }));
        await page.typeText(ref, text);
        if (params.submit)
            await page.pressKey('Enter');
    }
    return data;
}
export async function stepFill(page, params, data, args) {
    if (isRecord(params)) {
        const ref = String(render(params.ref ?? '', { args, data })).replace(/^@/, '');
        const text = String(render(params.text ?? '', { args, data }));
        await page.fillText(ref, text);
        if (params.submit)
            await page.pressKey('Enter');
    }
    return data;
}
export async function stepWait(page, params, data, args) {
    if (typeof params === 'number')
        await page.wait(params);
    else if (isRecord(params)) {
        if ('text' in params) {
            await page.wait({
                text: String(render(params.text, { args, data })),
                timeout: typeof params.timeout === 'number' ? params.timeout : undefined,
            });
        }
        else if ('time' in params)
            await page.wait(Number(params.time));
    }
    else if (typeof params === 'string')
        await page.wait(Number(render(params, { args, data })));
    return data;
}
export async function stepPress(page, params, data, args) {
    await page.pressKey(String(render(params, { args, data })));
    return data;
}
export async function stepSnapshot(page, params, _data, _args) {
    const opts = isRecord(params) ? params : {};
    return page.snapshot({
        interactive: typeof opts.interactive === 'boolean' ? opts.interactive : false,
        compact: typeof opts.compact === 'boolean' ? opts.compact : false,
        maxDepth: typeof opts.max_depth === 'number' ? opts.max_depth : undefined,
        raw: typeof opts.raw === 'boolean' ? opts.raw : false,
    });
}
export async function stepEvaluate(page, params, data, args) {
    const js = String(render(params, { args, data }));
    let result = await page.evaluate(js);
    // Browser may return JSON as a string — auto-parse it
    if (typeof result === 'string') {
        const trimmed = result.trim();
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
                result = JSON.parse(trimmed);
            }
            catch { }
        }
    }
    return result;
}
