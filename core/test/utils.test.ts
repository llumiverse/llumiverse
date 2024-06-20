import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { describe, expect, test } from "vitest";
import { JSONArray, JSONObject, extractAndParseJSON, parseJSON } from "../src/json";
import { validateResult } from '../src/validation';
import { readDataFile } from './utils';

describe('Core Utilities', () => {
    test('extractAndParseJSON', () => {
        const r = extractAndParseJSON('bla {"a": 1, "b": 2} bla bla');
        expect(r).toEqual({ a: 1, b: 2 });
    });

    test('parseJSON', () => {
        const url = new URL("./json.txt", import.meta.url);
        const text = readFileSync(url, "utf8");
        const json = parseJSON(text)!;
        expect((json as JSONObject).key1).toBe("value1 \" test");
        expect((json as JSONObject).key2).toBe("value2");
        expect((json as JSONObject).key3).toBe("value3");
        expect((json as JSONObject).key4).toBe("value4\nwith new line");
        const obj = (json as JSONObject).object as JSONObject;
        const arr = obj.array as JSONArray;
        expect(arr.length).toBe(2);
        expect(arr[0]).toBe("item1");
        const nestedArr = arr[1] as JSONArray;
        expect(nestedArr.length).toBe(1);
        expect(nestedArr[0]).toStrictEqual({ "nested": "object" });
    });

    test('Validate JSON against schema', () => {
        const ajv = new Ajv({ coerceTypes: true, allowDate: true, strict: false});
        const schema = parseJSON(readDataFile('ciia-schema.json')) as any;
        const content = parseJSON(readDataFile('ciia-data.json')) as any;
        const res = validateResult(content, schema);
        console.log(res);
    });

    test('Validate JSON against complex schema', () => {
        const ajv = new Ajv({ coerceTypes: true, allowDate: true, strict: false});
        const schema = parseJSON(readDataFile('complex-schema.json')) as any;
        const content = parseJSON(readDataFile('complex-document.json')) as any;
        const res = validateResult(content, schema);
        console.log(res);
    });

    test('Fail at validating JSON against schema', () => {
        const schema = parseJSON(readDataFile('ciia-schema.json')) as any;
        const content = parseJSON(readDataFile('ciia-data-wrong.json')) as any;   
        expect((content, schema) => validateResult(content, schema).toThrowError('validation_error')); 
     
    });

    test('JSON parser should coerce types', () => {
        const schema = parseJSON(readDataFile('ciia-schema.json')) as any;
        const content = parseJSON(readDataFile('ciia-data-wrong-types.json')) as any;   
        const res = validateResult(content, schema);
        console.log(res);
    });

})
