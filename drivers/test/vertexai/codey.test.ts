import { Assertion, assert } from "chai";
import { Completion, CompletionStream, Driver, ExecutionResponse, PromptRole, PromptSegment } from '@llumiverse/core';
import { VertexAIDriver } from "../../src/index.js";

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "Hello"
    }
]
//TODO you need to define a GOOGLE_APPLICATION_CREDENTIALSenv var for authentiocation
const driver = new VertexAIDriver({
    project: "dengenlabs",
    region: "us-central1",
    logger: false
}) as Driver;


function assertCompletionOk(r: ExecutionResponse) {
    assert.isFalse(!!r.error)
    assert.isNotEmpty(r.prompt)
    assert.isNotEmpty(r.token_usage)
    assert.isTrue(r.result && r.result.length > 2)
    //console.log('###', r.result);
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

describe('VertexAI: Test prediction of codey models', function () {
    this.timeout(10000); // 10 seconds
    it('text-bison completion works', (done) => {
        driver.execute(prompt, { model: 'text-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertCompletionOk(r);
            done();
        }).catch(done);
    });
    it('chat-bison streaming completion works', (done) => {
        driver.stream(prompt, { model: 'chat-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertStreamingCompletionOk(r);
            done();
        }).catch(done);
    });
    it('code-bison completion works', (done) => {
        driver.execute(prompt, { model: 'code-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertCompletionOk(r);
            done();
        }).catch(done);
    });
    it('code-bison streaming completion works', (done) => {
        driver.stream(prompt, { model: 'code-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertStreamingCompletionOk(r);
            done();
        }).catch(done);
    });
    it('codechat-bison completion works', (done) => {
        driver.execute(prompt, { model: 'codechat-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertCompletionOk(r);
            done();
        }).catch(done);
    });
    it('codechat-bison streaming completion works', (done) => {
        driver.stream(prompt, { model: 'codechat-bison', temperature: 0.8, max_tokens: 1024 }).then(r => {
            assertStreamingCompletionOk(r);
            done();
        }).catch(done);
    });
})

