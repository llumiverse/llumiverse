import { Driver, PromptRole, PromptSegment } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { TogetherAIDriver } from "../../src/index.js";
import { assertCompletionOk, assertStreamingCompletionOk } from '../assertions.js';

const TIMEOUT = 10000;

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "Hello"
    }
]
//TODO you need to define a GOOGLE_APPLICATION_CREDENTIALSenv var for authentiocation
const driver = new TogetherAIDriver({
    apiKey: process.env.TOGETHER_API_KEY as string
}) as Driver;


describe('TogetherAI driver', function () {
    test('list models', async () => {
        const r = await driver.listModels();
        expect(r.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test('execute prompt against mistral', async () => {
        const r = await driver.execute(prompt, { model: 'mistralai/Mistral-7B-v0.1', temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
    }, TIMEOUT);
    test('execute prompt against mistral (streaming mode)', async () => {
        const r = await driver.stream(prompt, { model: 'mistralai/Mistral-7B-v0.1', temperature: 0.8, max_tokens: 1024 })
        assertStreamingCompletionOk(r);
    }, TIMEOUT);
})

