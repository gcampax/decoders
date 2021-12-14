// @flow strict

import { annotate } from '../../annotate';
import { compose, map } from '../composition';
import { err, ok, unwrap } from '../../result';
import { guard } from '../../_guard';
import { number } from '../number';
import { string } from '../string';

describe('compose', () => {
    const hex = compose(
        // We already know how to decode strings...
        string,

        // We'll try to parse it as an hex int, but if it fails, we'll
        // return Err, otherwise Ok
        (s) => {
            const n = parseInt(s, 16);
            return !Number.isNaN(n) ? ok(n) : err(annotate(n, 'Nope'));
        },
    );

    it('valid type of decode result', () => {
        expect(unwrap(hex('100'))).toEqual(256);
        expect(unwrap(hex('DEADC0DE'))).toEqual(0xdeadc0de);
    });

    it('invalid', () => {
        expect(() => guard(hex)('no good hex value')).toThrow('Nope');
    });
});

describe('map', () => {
    it('change type of decode result', () => {
        // s.length can never fail, so this is a good candidate for map() over
        // compose()
        const len = map(string, (s) => s.length);
        expect(unwrap(len('foo'))).toEqual(3);
        expect(unwrap(len('Lorem ipsum dolor sit amet.'))).toEqual(27);
    });

    it('change value, not type, of decoded results', () => {
        const upcase = map(string, (s) => s.toUpperCase());
        expect(unwrap(upcase('123'))).toEqual('123');
        expect(unwrap(upcase('I am Hulk'))).toEqual('I AM HULK');
    });

    it('a failing mapper will fail the decoder', () => {
        const odd = map(number, (n) => {
            if (n % 2 !== 0) return n;
            throw new Error('Must be odd');
        });
        expect(unwrap(odd(13))).toEqual(13);
        expect(() => guard(odd)(4)).toThrow('^ Must be odd');
        expect(odd(3).type).toBe('ok');
        expect(odd(4).type).toBe('err');

        const weirdEven = map(number, (n) => {
            if (n % 2 === 0) return n;
            throw 'Must be even'; // Throwing a string, not an Error is non-conventional, but won't break anything
        });
        expect(weirdEven(3).type).toBe('err');
        expect(() => guard(weirdEven)(3)).toThrow('^ Must be even');
        expect(unwrap(weirdEven(4))).toEqual(4);
    });
});
