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
export declare const webColors: {
    enabled: boolean;
    reset: (text: string) => string;
    bold: (text: string) => string;
    dim: (text: string) => string;
    italic: (text: string) => string;
    underline: (text: string) => string;
    inverse: (text: string) => string;
    hidden: (text: string) => string;
    strikethrough: (text: string) => string;
    black: (text: string) => string;
    red: (text: string) => string;
    green: (text: string) => string;
    yellow: (text: string) => string;
    blue: (text: string) => string;
    magenta: (text: string) => string;
    cyan: (text: string) => string;
    white: (text: string) => string;
    gray: (text: string) => string;
    grey: (text: string) => string;
};
export type Colors = typeof webColors;
export declare const noColors: Colors;
