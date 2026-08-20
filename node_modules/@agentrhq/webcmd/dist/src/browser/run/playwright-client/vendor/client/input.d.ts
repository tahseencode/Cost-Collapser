/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Page } from './page';
import type * as api from '../../types/types';
import type * as channels from '@protocol/channels';
export declare class Keyboard implements api.Keyboard {
    private _page;
    constructor(page: Page);
    down(key: string): Promise<void>;
    up(key: string): Promise<void>;
    insertText(text: string): Promise<void>;
    type(text: string, options?: channels.PageKeyboardTypeOptions): Promise<void>;
    press(key: string, options?: channels.PageKeyboardPressOptions): Promise<void>;
}
export declare class Mouse implements api.Mouse {
    private _page;
    constructor(page: Page);
    move(x: number, y: number, options?: {
        steps?: number;
    }): Promise<void>;
    down(options?: channels.PageMouseDownOptions): Promise<void>;
    up(options?: channels.PageMouseUpOptions): Promise<void>;
    click(x: number, y: number, options?: channels.PageMouseClickOptions): Promise<void>;
    dblclick(x: number, y: number, options?: Omit<channels.PageMouseClickOptions, 'clickCount'>): Promise<void>;
    wheel(deltaX: number, deltaY: number): Promise<void>;
}
export declare class Touchscreen implements api.Touchscreen {
    private _page;
    constructor(page: Page);
    tap(x: number, y: number): Promise<void>;
}
