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
type TypedArrayKind = 'i8' | 'ui8' | 'ui8c' | 'i16' | 'ui16' | 'i32' | 'ui32' | 'f32' | 'f64' | 'bi64' | 'bui64';
export type SerializedValue = undefined | boolean | number | string | {
    v: 'null' | 'undefined' | 'NaN' | 'Infinity' | '-Infinity' | '-0';
} | {
    d: string;
} | {
    u: string;
} | {
    bi: string;
} | {
    e: {
        n: string;
        m: string;
        s: string;
    };
} | {
    r: {
        p: string;
        f: string;
    };
} | {
    a: SerializedValue[];
    id: number;
} | {
    o: {
        k: string;
        v: SerializedValue;
    }[];
    id: number;
} | {
    ref: number;
} | {
    h: number;
} | {
    ta: {
        b: string;
        k: TypedArrayKind;
    };
} | {
    ab: {
        b: string;
    };
};
type HandleOrValue = {
    h: number;
} | {
    fallThrough: any;
};
export declare function parseEvaluationResultValue(value: SerializedValue, handles?: any[], refs?: Map<number, object>): any;
export declare function serializeAsCallArgument(value: any, handleSerializer: (value: any) => HandleOrValue): SerializedValue;
export {};
