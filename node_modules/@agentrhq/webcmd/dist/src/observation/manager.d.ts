import { ObservationSession, type ObservationSessionOptions } from './session.js';
import type { ObservationScope } from './events.js';
export declare class ObservationManager {
    private readonly sessions;
    start(opts: ObservationSessionOptions): ObservationSession;
    get(id: string): ObservationSession | undefined;
    stop(id: string): ObservationSession | undefined;
    findByScope(scope: ObservationScope): ObservationSession[];
}
