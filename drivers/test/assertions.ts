
import { CompletionStream, ExecutionResponse, extractAndParseJSON } from '@llumiverse/core';
import { expect } from "vitest";

export function assertCompletionOk(r: ExecutionResponse) {
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    expect(r.token_usage).toBeTruthy();
    //if r.result is string, it should be longer than 2
    if (typeof r.result === 'string') {
        expect(r.result.length).toBeGreaterThan(2);
    } else {
        //if r.result is object, it should have at least 1 property
        expect(Object.keys(r.result).length).toBeGreaterThan(0);
    }

}

export async function assertStreamingCompletionOk(stream: CompletionStream, jsonMode: boolean=false) {

    const out: string[] = []
    for await (const chunk of stream) {
        out.push(chunk)
    }

    const r = stream.completion as ExecutionResponse;
    const jsonObject = jsonMode ? extractAndParseJSON(out.join('')) : undefined;

    if (jsonMode) expect(r.result).toStrictEqual(jsonObject);
    
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    expect(r.token_usage).toBeTruthy();
    if (typeof r.result === "string")  expect(r.result?.length).toBeGreaterThan(2);
}
