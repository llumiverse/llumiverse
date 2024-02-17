import { Driver, PromptRole, PromptSegment } from '@llumiverse/core';
import 'dotenv/config';
import { JSONSchema4 } from 'json-schema';
import { describe, expect, test } from "vitest";
import { TogetherAIDriver } from "../../src/index.js";
import { assertCompletionOk, assertStreamingCompletionOk } from '../assertions.js';

const TIMEOUT = 120 * 100;

const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "What color is the sky?"
    }
]

//json schema with 2 properties object and color
const skySchema: JSONSchema4 = {
    type: "object",
    properties: {
        object: {
            type: "string"
        },
        color: {
            type: "string"
        }
    }
}

if (!process.env.TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY environment variable is not set');
}

const driver = new TogetherAIDriver({
    apiKey: process.env.TOGETHER_API_KEY as string
}) as Driver;

const models = [
    "meta-llama/Llama-2-70b-chat-hf",
    "mistralai/Mixtral-8x7B-Instruct-v0.1"
]


describe('TogetherAI driver', function () {
    test('list models', async () => {
        const r = await driver.listModels();
        expect(r.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test.each(models)('execute prompt on %s', async (model) => {
        const r = await driver.execute(prompt, { model, temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
    }, TIMEOUT);

    test.each(models)('execute prompt with streaming on %s', async (model) => {
        const r = await driver.stream(prompt, { model, temperature: 0.8, max_tokens: 1024 })
        assertStreamingCompletionOk(r);
    }, TIMEOUT);

    test.each(models)('execute prompt with schema on %s', async (model) => {
        const r = await driver.execute(prompt, { model: "mistralai/Mixtral-8x7B-Instruct-v0.1", temperature: 0.8, max_tokens: 1024, resultSchema: skySchema });
        assertCompletionOk(r);
    }, TIMEOUT);

})

