import { ObservationSession } from './session.js';
export class ObservationManager {
    sessions = new Map();
    start(opts) {
        const session = new ObservationSession(opts);
        this.sessions.set(session.id, session);
        return session;
    }
    get(id) {
        return this.sessions.get(id);
    }
    stop(id) {
        const session = this.sessions.get(id);
        this.sessions.delete(id);
        return session;
    }
    findByScope(scope) {
        return [...this.sessions.values()].filter((session) => scopeMatches(session.scope, scope));
    }
}
function scopeMatches(actual, expected) {
    return actual.session === expected.session
        && (expected.contextId === undefined || actual.contextId === expected.contextId)
        && (expected.target === undefined || actual.target === expected.target)
        && (expected.site === undefined || actual.site === expected.site)
        && (expected.command === undefined || actual.command === expected.command);
}
