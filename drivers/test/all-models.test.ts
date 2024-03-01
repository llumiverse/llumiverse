import { AbstractDriver } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { MistralAIDriver, TogetherAIDriver } from '../src';
import { assertCompletionOk, assertStreamingCompletionOk } from './assertions';
import { testPrompt_color, testSchema_color } from './samples';

const TIMEOUT = 120 * 1000;


interface TestDriver {
    driver: AbstractDriver;
    models: string[];
    name: string;
}

const drivers: TestDriver[] = [];

if (process.env.MISTRAL_API_KEY) {
    drivers.push({
        name: "MistralAI La Plateforme",
        driver: new MistralAIDriver({
            apiKey: process.env.MISTRAL_API_KEY as string,
            endpointUrl: process.env.MISTRAL_ENDPOINT_URL as string ?? undefined
        }),
        models: [
            "open-mixtral-8x7b",
            "mistral-medium-latest",
            "mistral-large-latest"
        ]
    }
    )
} else {
    console.warn("MistralAI tests are skipped: MISTRAL_API_KEY environment variable is not set");
}

if (process.env.TOGETHER_API_KEY) {
    drivers.push({
        name: "TogetherAI",
        driver: new TogetherAIDriver({
            apiKey: process.env.TOGETHER_API_KEY as string
        }),
        models: [
            "togethercomputer/CodeLlama-34b-Instruct",
            "mistralai/Mixtral-8x7B-Instruct-v0.1"
        ]
    }
    )
} else {
    console.warn("TogetherAI tests are skipped: TOGETHER_API_KEY environment variable is not set");
}

describe.each(drivers)("Driver $name", ({ name, driver, models }) => {

    test('list models', async () => {
        const r = await driver.listModels();
        expect(r.length).toBeGreaterThan(0);
        console.log(r);
    }, TIMEOUT);


    test.each(models)('execute prompt on %s', async (model) => {
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
        console.log(r);
    }, TIMEOUT);

    test.each(models)('execute prompt with streaming on %s', async (model) => {
        const r = await driver.stream(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 })
        await assertStreamingCompletionOk(r);
    }, TIMEOUT);

    test.each(models)('execute prompt with schema on %s', async (model) => {
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024, resultSchema: testSchema_color });
        assertCompletionOk(r);
        console.log(r);
    }, TIMEOUT);

});

