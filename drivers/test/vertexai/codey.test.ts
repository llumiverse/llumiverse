import { Driver, PromptRole, PromptSegment } from '@llumiverse/core';
import { describe, test } from "vitest";
import { VertexAIDriver } from "../../src/index.js";
import { assertCompletionOk, assertStreamingCompletionOk } from "../assertions.js";

const TIMEOUT = 10000;

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "Hello"
    }
]
//TODO you need to define a GOOGLE_APPLICATION_CREDENTIALS env var for authentiocation
const driver = new VertexAIDriver({
    project: "dengenlabs",
    region: "us-central1"
}) as Driver;

describe('VertexAI: Test prediction of codey models', function () {
    test('text-bison completion works', async () => {
        const r = await driver.execute(prompt, { model: 'text-bison', temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
    }, TIMEOUT);
    test('chat-bison streaming completion works', async () => {
        const r = await driver.stream(prompt, { model: 'chat-bison', temperature: 0.8, max_tokens: 1024 });
        await assertStreamingCompletionOk(r);
    }, TIMEOUT);
    test('code-bison completion works', async () => {
        const r = await driver.execute(prompt, { model: 'code-bison', temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
    }, TIMEOUT);
    test('code-bison streaming completion works', async () => {
        const r = await driver.stream(prompt, { model: 'code-bison', temperature: 0.8, max_tokens: 1024 });
        await assertStreamingCompletionOk(r);
    }, TIMEOUT);
    test('codechat-bison completion works', async () => {
        const r = await driver.execute(prompt, { model: 'codechat-bison', temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
    }, TIMEOUT);
    test('codechat-bison streaming completion works', async () => {
        const r = await driver.stream(prompt, { model: 'codechat-bison', temperature: 0.8, max_tokens: 1024 });
        await assertStreamingCompletionOk(r);
    }, TIMEOUT);
});
