import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectProcess, discoverAppPath, electronLaunchArgs, launchDetachedApp, launchElectronApp, probeCDP, resolveExecutableCandidates } from './launcher.js';
function createMockChildProcess() {
    const listeners = new Map();
    return {
        once: vi.fn((event, handler) => {
            listeners.set(event, [...(listeners.get(event) ?? []), handler]);
        }),
        off: vi.fn((event, handler) => {
            listeners.set(event, (listeners.get(event) ?? []).filter((listener) => listener !== handler));
        }),
        unref: vi.fn(),
        emit: (event, value) => {
            for (const listener of listeners.get(event) ?? [])
                listener(value);
        },
    };
}
vi.mock('node:child_process', () => ({
    execFileSync: vi.fn(),
    spawn: vi.fn(),
}));
const cp = vi.mocked(await import('node:child_process'));
describe('probeCDP', () => {
    it('returns false when CDP endpoint is unreachable', async () => {
        const result = await probeCDP(59999, 500);
        expect(result).toBe(false);
    });
});
describe('detectProcess', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it('returns false when pgrep finds no process', () => {
        cp.execFileSync.mockImplementation(() => {
            const err = new Error('exit 1');
            err.status = 1;
            throw err;
        });
        const result = detectProcess('NonExistentApp');
        expect(result).toBe(false);
    });
    it.skipIf(process.platform === 'win32')('returns true when pgrep finds a process', () => {
        cp.execFileSync.mockReturnValue('12345\n');
        const result = detectProcess('Cursor');
        expect(result).toBe(true);
    });
});
describe('discoverAppPath', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it.skipIf(process.platform !== 'darwin')('returns path when osascript succeeds', () => {
        cp.execFileSync.mockReturnValue('/Applications/Cursor.app/\n');
        const result = discoverAppPath('Cursor');
        expect(result).toBe('/Applications/Cursor.app');
    });
    it.skipIf(process.platform !== 'darwin')('returns null when osascript fails', () => {
        cp.execFileSync.mockImplementation(() => {
            throw new Error('app not found');
        });
        const result = discoverAppPath('NonExistent');
        expect(result).toBeNull();
    });
    it.skipIf(process.platform === 'darwin')('returns null on non-darwin platform', () => {
        const result = discoverAppPath('Cursor');
        expect(result).toBeNull();
    });
});
describe('launchDetachedApp', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        cp.spawn.mockReset();
    });
    it('unrefs the process after spawn succeeds', async () => {
        const child = createMockChildProcess();
        cp.spawn.mockImplementation(() => {
            queueMicrotask(() => child.emit('spawn'));
            return child;
        });
        await expect(launchDetachedApp('/Applications/Antigravity.app/Contents/MacOS/Antigravity', ['--remote-debugging-port=9234'], 'Antigravity'))
            .resolves
            .toBeUndefined();
        expect(child.unref).toHaveBeenCalledTimes(1);
    });
    it('converts ENOENT into a controlled launch error', async () => {
        const child = createMockChildProcess();
        cp.spawn.mockImplementation(() => {
            queueMicrotask(() => child.emit('error', Object.assign(new Error('missing binary'), { code: 'ENOENT' })));
            return child;
        });
        await expect(launchDetachedApp('/Applications/Antigravity.app/Contents/MacOS/Antigravity', ['--remote-debugging-port=9234'], 'Antigravity'))
            .rejects
            .toThrow('Could not launch Antigravity');
        expect(child.unref).not.toHaveBeenCalled();
    });
});
describe('resolveExecutableCandidates', () => {
    it('prefers explicit executable candidates over processName', () => {
        const app = {
            port: 9234,
            processName: 'Antigravity',
            executableNames: ['Electron', 'Antigravity'],
        };
        expect(resolveExecutableCandidates('/Applications/Antigravity.app', app)).toEqual([
            '/Applications/Antigravity.app/Contents/MacOS/Electron',
            '/Applications/Antigravity.app/Contents/MacOS/Antigravity',
        ]);
    });
});
describe('electronLaunchArgs', () => {
    it('includes Chromium 142 WebSocket origin allow-list for auto-launched Electron apps', () => {
        expect(electronLaunchArgs(9234)).toEqual([
            '--remote-debugging-port=9234',
            '--remote-allow-origins=*',
        ]);
    });
    it('preserves app-specific extra launch args after the required CDP flags', () => {
        expect(electronLaunchArgs(9234, ['--foo=bar'])).toEqual([
            '--remote-debugging-port=9234',
            '--remote-allow-origins=*',
            '--foo=bar',
        ]);
    });
});
describe('launchElectronApp', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        cp.spawn.mockReset();
    });
    it('falls back to the next executable candidate when the first is missing', async () => {
        const firstChild = createMockChildProcess();
        const secondChild = createMockChildProcess();
        const app = {
            port: 9234,
            processName: 'Antigravity',
            executableNames: ['Electron', 'Antigravity'],
        };
        cp.spawn
            .mockImplementationOnce(() => {
            queueMicrotask(() => firstChild.emit('error', Object.assign(new Error('missing binary'), { code: 'ENOENT' })));
            return firstChild;
        })
            .mockImplementationOnce(() => {
            queueMicrotask(() => secondChild.emit('spawn'));
            return secondChild;
        });
        await expect(launchElectronApp('/Applications/Antigravity.app', app, ['--remote-debugging-port=9234'], 'Antigravity')).resolves.toBeUndefined();
        expect(cp.spawn).toHaveBeenNthCalledWith(1, '/Applications/Antigravity.app/Contents/MacOS/Electron', ['--remote-debugging-port=9234'], { detached: true, stdio: 'ignore' });
        expect(cp.spawn).toHaveBeenNthCalledWith(2, '/Applications/Antigravity.app/Contents/MacOS/Antigravity', ['--remote-debugging-port=9234'], { detached: true, stdio: 'ignore' });
        expect(secondChild.unref).toHaveBeenCalledTimes(1);
    });
});
