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
import type { CSSComplexSelectorList } from './cssParser';
export { InvalidSelectorError, isInvalidSelectorError } from './cssParser';
export type NestedSelectorBody = {
    parsed: ParsedSelector;
    distance?: number;
};
export type ParsedSelectorPart = {
    name: string;
    body: string | CSSComplexSelectorList | NestedSelectorBody;
    source: string;
};
export type ParsedSelector = {
    parts: ParsedSelectorPart[];
    capture?: number;
};
export declare const customCSSNames: Set<string>;
export declare function parseSelector(selector: string): ParsedSelector;
export declare function splitSelectorByFrame(selectorText: string): ParsedSelector[];
export declare function stringifySelector(selector: string | ParsedSelector, forceEngineName?: boolean): string;
export declare function visitAllSelectorParts(selector: ParsedSelector, visitor: (part: ParsedSelectorPart, nested: boolean) => void): void;
export type AttributeSelectorOperator = '<truthy>' | '=' | '*=' | '|=' | '^=' | '$=' | '~=';
export type AttributeSelectorPart = {
    name: string;
    jsonPath: string[];
    op: AttributeSelectorOperator;
    value: any;
    caseSensitive: boolean;
};
export type AttributeSelector = {
    name: string;
    attributes: AttributeSelectorPart[];
};
export declare function parseAttributeSelector(selector: string, allowUnquotedStrings: boolean): AttributeSelector;
