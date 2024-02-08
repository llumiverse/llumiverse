
import { CompletionStream, ExecutionResponse } from '@llumiverse/core';
import { expect } from "vitest";

export function assertCompletionOk(r: ExecutionResponse) {
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    expect(r.token_usage).toBeTruthy();
    expect(r.result.length).toBeGreaterThan(2)
    //console.log('###', r.result);
}

export async function assertStreamingCompletionOk(stream: CompletionStream) {

    const out: string[] = []
    for await (const chunk of stream) {
        out.push(chunk)
    }
    const r = stream.completion as ExecutionResponse;
    //console.log('###stream', r.result, out);

    expect(r.result).toBe(out.join(''));
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    expect(r.token_usage).toBeTruthy();
    expect(r.result?.length).toBeGreaterThan(2);
}
