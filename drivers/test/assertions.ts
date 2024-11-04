
import { Bedrock } from '@aws-sdk/client-bedrock';
import { CompletionStream, ExecutionResponse, extractAndParseJSON } from '@llumiverse/core';
import { expect } from "vitest";
import { BedrockDriver } from '../src';

export function assertCompletionOk(r: ExecutionResponse, model?: string, driver?) {
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    //TODO: This just checks for existence of the object,
    //could do with more thorough test however not all models support token_usage.
    //Only create the object when there is meaningful information you want to interpret as a pass.
    if (!(driver?.provider == 'bedrock' && model?.includes("mistral"))) { //Skip if bedrock:mistral, token_usage not supported.
        expect(r.token_usage).toBeTruthy();
    }
    expect(r.finish_reason).toBeTruthy();
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
        //console.log("-----",chunk)
        if (typeof chunk === 'string'){
            out.push(chunk)
        } else {
            out.push(chunk.result)
        }
    }

    const r = stream.completion as ExecutionResponse;
    const jsonObject = jsonMode ? extractAndParseJSON(out.join('')) : undefined;

    if (jsonMode) expect(r.result).toStrictEqual(jsonObject);
    
    expect(r.error).toBeFalsy();
    expect(r.prompt).toBeTruthy();
    expect(r.token_usage).toBeTruthy();
    expect(r.finish_reason).toBeTruthy();
    if (typeof r.result === "string")  expect(r.result?.length).toBeGreaterThan(2);

    return out;
}
