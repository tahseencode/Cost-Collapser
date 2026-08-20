/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export declare class MultiMap<K, V> {
    private _map;
    constructor();
    set(key: K, value: V): void;
    get(key: K): V[];
    has(key: K): boolean;
    delete(key: K, value: V): void;
    deleteAll(key: K): void;
    hasValue(key: K, value: V): boolean;
    get size(): number;
    [Symbol.iterator](): Iterator<[K, V[]]>;
    keys(): IterableIterator<K>;
    values(): Iterable<V>;
    clear(): void;
}
