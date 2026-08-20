/**
 * The MIT License (MIT)
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Copyright (c) 2016-2023 Isaac Z. Schlueter i@izs.me, James Talmage james@talmage.io (github.com/jamestalmage), and
 * Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
export type RawStack = string[];
export type StackFrame = {
    file: string;
    line: number;
    column: number;
    function?: string;
};
export declare function captureRawStack(): RawStack;
export declare function parseStackFrame(text: string, pathSeparator: string, showInternalStackFrames: boolean): StackFrame | null;
export declare function rewriteErrorMessage<E extends Error>(e: E, newMessage: string): E;
export declare function stringifyStackFrames(frames: StackFrame[]): string[];
export declare function splitErrorMessage(message: string): {
    name: string;
    message: string;
};
export declare function parseErrorStack(stack: string, pathSeparator: string, showInternalStackFrames?: boolean): {
    message: string;
    stackLines: string[];
    location?: StackFrame;
};
