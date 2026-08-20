/**
 * Injected script for discovering Pinia or Vuex stores and their actions/state representations.
 *
 * This function is serialized via `.toString()` and evaluated inside the page context,
 * so the types below only exist at the TS boundary — the runtime shapes are whatever
 * Pinia/Vuex put on the Vue app. We use narrow structural types for the fields we touch.
 */
export declare function discoverStores(): {
    type: string;
    id: string;
    actions: string[];
    stateKeys: string[];
}[];
