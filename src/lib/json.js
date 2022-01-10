// @flow strict

import { array } from './arrays';
import { boolean } from './booleans';
import { dict } from './objects';
import { either } from './unions';
import { lazy } from './utilities';
import { null_ } from './basics';
import { number } from './numbers';
import { string } from './strings';
import type { Decoder } from '../_decoder';

export type JSONValue = null | string | number | boolean | JSONObject | JSONArray;
export type JSONObject = { [string]: JSONValue };
export type JSONArray = Array<JSONValue>;

/**
 * Like `json`, but will only decode when the JSON value is an object.
 */
export const jsonObject: Decoder<JSONObject> = lazy(() => dict(json));

/**
 * Like `json`, but will only decode when the JSON value is an array.
 */
export const jsonArray: Decoder<JSONArray> = lazy(() => array(json));

/**
 * Accepts any value that's a valid JSON value.
 *
 * In other words: any value returned by `JSON.parse()` should decode without
 * failure.
 *
 * ```typescript
 * type JSONValue =
 *     | null
 *     | string
 *     | number
 *     | boolean
 *     | { [string]: JSONValue }
 *     | JSONValue[]
 * ```
 */
export const json: Decoder<JSONValue> = either(
    null_,
    string,
    number,
    boolean,
    jsonObject,
    jsonArray,
).describe('Must be valid JSON value');
