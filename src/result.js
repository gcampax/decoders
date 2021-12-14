// @flow strict

/**
 * Result <value> <error>
 *     = Ok <value>
 *     | Err <error>
 */

type Ok<+T> = {| +type: 'ok', +value: T, +error: void |};
type Err<+E> = {| +type: 'err', +value: void, +error: E |};

export type Result<+T, +E> = Ok<T> | Err<E>;

/**
 * Create a new Result instance representing a successful computation.
 */
export function ok<T>(value: T): Ok<T> {
    return { type: 'ok', value, error: undefined };
}

/**
 * Create a new Result instance representing a failed computation.
 */
export function err<E>(error: E): Err<E> {
    return { type: 'err', value: undefined, error };
}

/**
 * Unwrap the value from this Result instance if this is an "Ok" result.
 * Otherwise, will throw the "Err" error via a runtime exception.
 */
export function unwrap<T>(result: Result<T, mixed>): T {
    if (result.type === 'ok') {
        return result.value;
    } else {
        throw result.error;
    }
}

export function expect<T>(result: Result<T, mixed>, message: string | Error): T {
    if (result.type === 'ok') {
        return result.value;
    } else {
        throw message instanceof Error ? message : new Error(message);
    }
}

export function dispatch<T, E, O>(
    result: Result<T, E>,
    okCallback: (value: T) => O,
    errCallback: (error: E) => O,
): O {
    return result.type === 'ok' ? okCallback(result.value) : errCallback(result.error);
}

/**
 * Like .and(), aka &&, but the second argument gets evaluated lazily only if
 * the first result is an Ok result. If so, it has access to the Ok value from
 * the first argument.
 */
export function andThen<T, E, T2>(
    result1: Result<T, E>,
    lazyResult2: (value: T) => Result<T2, E>,
): Result<T2, E> {
    return result1.type === 'ok' ? lazyResult2(result1.value) : result1;
}

/**
 * Like .or(), aka ||, but the second argument gets evaluated lazily only if
 * the first result is an Err result. If so, it has access to the Err value
 * from the first argument.
 */
export function orElse<T, E, E2>(
    result1: Result<T, E>,
    lazyResult2: (errValue: E) => Result<T, E2>,
): Result<T, E2> {
    return result1.type === 'ok' ? result1 : lazyResult2(result1.error);
}

/**
 * Transform an Ok result. Will not touch Err results.
 */
export function mapOk<T, E, T2>(
    result: Result<T, E>,
    mapper: (value: T) => T2,
): Result<T2, E> {
    return result.type === 'ok' ? ok(mapper(result.value)) : result;
}

/**
 * Transform an Err value. Will not touch Ok results.
 */
export function mapError<T, E, E2>(
    result: Result<T, E>,
    mapper: (error: E) => E2,
): Result<T, E2> {
    return result.type === 'ok' ? result : err(mapper(result.error));
}