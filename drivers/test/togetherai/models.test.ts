import { CompletionStream, Driver, ExecutionResponse, PromptRole, PromptSegment } from '@llumiverse/core';
import { assert } from "chai";
import 'dotenv/config';
import { TogetherAIDriver } from "../../src/index.js";

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "Hello"
    }
]

if (!process.env.TOGETHERAI_TEST_APIKEY) {
    throw new Error('TOGETHERAI_TEST_APIKEY is not defined');
}

const driver = new TogetherAIDriver({
    apiKey: process.env.TOGETHERAI_TEST_APIKEY as string,
    logger: false
}) as Driver;


function assertCompletionOk(r: ExecutionResponse) {
    assert.isFalse(!!r.error)
    assert.isNotEmpty(r.prompt)
    assert.isNotEmpty(r.token_usage)
    assert.isTrue(r.result && r.result.length > 2)
}

async function assertStreamingCompletionOk(stream: CompletionStream) {

    const out = []
    for await (const chunk of stream) {
        out.push(chunk)
    }
    const r = stream.completion as ExecutionResponse;
    //console.log('###stream', r.result, out);

    assert.strictEqual(r.result, out.join(''))
    assert.isFalse(!!r.error)
    assert.isNotEmpty(r.prompt)
    assert.isNotEmpty(r.token_usage)
    assert.isTrue(r.result && r.result.length > 2)


}

describe('TogetherAI driver', function () {
    this.timeout(10000); // 10 seconds
    it('list models', (done) => {
        driver.listModels().then(r => {
            assert(r.length > 0)
            done();
        }).catch(done);
    });

    it('execute prompt against mistral', (done) => {
        driver.execute(prompt, { model: 'mistralai/Mistral-7B-v0.1', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertCompletionOk(r);
            done();
        }).catch(done);
    });
    it('execute prompt against mistral (streaming mode)', (done) => {
        driver.stream(prompt, { model: 'mistralai/Mistral-7B-v0.1', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertStreamingCompletionOk(r);
            done();
        }).catch(done);
    });
})

