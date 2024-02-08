import { expect, describe, test } from "vitest";
import { parseJSON } from "../src/json";

describe('Core Utilities', () => {
    test('parseJSON', () => {
        const r = parseJSON('bla {"a": 1, "b": 2} bla bla');
        expect(r).toEqual({ a: 1, b: 2 });
    });
})

