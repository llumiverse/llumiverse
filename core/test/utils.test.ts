import { readFileSync } from 'fs';
import { describe, expect, test } from "vitest";
import { JsonArray, JsonObject, extractAndParseJSON, parseJSON } from "../src/json";

describe('Core Utilities', () => {
    test('extractAndParseJSON', () => {
        const r = extractAndParseJSON('bla {"a": 1, "b": 2} bla bla');
        expect(r).toEqual({ a: 1, b: 2 });
    });

    test('parseJSON', () => {
        const url = new URL("./json.txt", import.meta.url);
        const text = readFileSync(url, "utf8");
        const json = parseJSON(text)!;
        expect((json as JsonObject).key1).toBe("value1 \" test");
        expect((json as JsonObject).key2).toBe("value2");
        expect((json as JsonObject).key3).toBe("value3");
        expect((json as JsonObject).key4).toBe("value4\nwith new line");
        const obj = (json as JsonObject).object as JsonObject;
        const arr = obj.array as JsonArray;
        expect(arr.length).toBe(2);
        expect(arr[0]).toBe("item1");
        const nestedArr = arr[1] as JsonArray;
        expect(nestedArr.length).toBe(1);
        expect(nestedArr[0]).toStrictEqual({ "nested": "object" });
    });
})

