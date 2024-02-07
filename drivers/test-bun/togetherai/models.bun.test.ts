import { expect, test, describe } from "bun:test";

import { Completion, CompletionStream, Driver, ExecutionResponse, PromptRole, PromptSegment } from '@llumiverse/core';
import { TogetherAIDriver, VertexAIDriver } from "../../src/index.js";

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "Hello"
    }
]

//TODO you need to define a GOOGLE_APPLICATION_CREDENTIALSenv var for authentiocation
const driver = new TogetherAIDriver({
    apiKey: process.env.TOGETHERAI_TEST_APIKEY as string,
    logger: false
}) as Driver;


// function assertCompletionOk(r: ExecutionResponse) {
//     expect(r.error).toBeUndefined();
//     expect(r.prompt).toBeDefined();
//     expect(r.token_usage).toBeDefined();
//     expect(r.result).toBeDefined();
//     expect(r.result.length).toBeGreaterThan(2);
//     //console.log('###', r.result);
// }

// async function assertStreamingCompletionOk(stream: CompletionStream) {

//     const out = []
//     for await (const chunk of stream) {
//         out.push(chunk)
//     }
//     const r = stream.completion as ExecutionResponse;
//     //console.log('###stream', r.result, out);

//     expect(r.result).toEqual(out.join(''));
//     expect(r.error).toBeUndefined();
//     expect(r.prompt).toBeDefined();
//     expect(r.token_usage).toBeDefined();
//     expect(r.result.length).toBeGreaterThan(2);
// }

describe('TogetherAI driver', function () {
    test('list models', (done) => {
        driver.listModels().then(r => {
            expect(r.length > 0).toBeTrue();
            done();
        }).catch(done);
    }, 10000);// 10 seconds
});

