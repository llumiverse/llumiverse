import { AbstractDriver } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { BedrockDriver, GroqDriver, MistralAIDriver, OpenAIDriver, TogetherAIDriver } from '../src';
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
        name: "mistralai",
        driver: new MistralAIDriver({
            apiKey: process.env.MISTRAL_API_KEY as string,
            endpoint_url: process.env.MISTRAL_ENDPOINT_URL as string ?? undefined
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
        name: "togetherai",
        driver: new TogetherAIDriver({
            apiKey: process.env.TOGETHER_API_KEY as string
        }),
        models: [
            "togethercomputer/CodeLlama-34b-Instruct",
            //"mistralai/Mixtral-8x7B-Instruct-v0.1" too slow in tests for now
        ]
    }
    )
} else {
    console.warn("TogetherAI tests are skipped: TOGETHER_API_KEY environment variable is not set");
}

if (process.env.OPENAI_API_KEY) {
    drivers.push({
        name: "openai",
        driver: new OpenAIDriver({
            apiKey: process.env.OPENAI_API_KEY as string
        }),
        models: [
            "gpt-4-turbo-preview",
            "gpt-3.5-turbo",
        ]
    }
    )
} else {
    console.warn("OpenAI tests are skipped: OPENAI_API_KEY environment variable is not set");
}

if (process.env.BEDROCK_REGION) {
    drivers.push({
        name: "bedrock",
        driver: new BedrockDriver({
            region: process.env.BEDROCK_REGION as string,
        }),
        models: [
            "anthropic.claude-3-sonnet-20240229-v1:0",
            "anthropic.claude-v2:1",
            "cohere.command-text-v14",
            "ai21.j2-mid-v1",
            "mistral.mixtral-8x7b-instruct-v0:1",
            "meta.llama2-70b-chat-v1",
            //"amazon.titan-tg1-large", ---> JSON Schema not working yet
            //"stability.stable-diffusion-xl-v1" --> NOT IMPLEMENTED
        ]
    }
    )
} else {
    console.warn("Bedrock tests are skipped: BEDROCK_REGION environment variable is not set");
}

if (process.env.GROQ_API_KEY) {

    drivers.push({
        name: "groq",
        driver: new GroqDriver({
            apiKey: process.env.GROQ_API_KEY as string
        }),
        models: [
            "llama2-70b-4096",
            "mixtral-8x7b-32768",
            "gemma-7b-it"
        ]
    })
} else {
    console.warn("Groq tests are skipped: GROQ_API_KEY environment variable is not set");
}

describe.concurrent.each(drivers)("Driver $name", ({ name, driver, models }) => {

    test(`${name}: list models`, async () => {
        const r = await driver.listModels();
        expect(r.length).toBeGreaterThan(0);
        //console.log(r);
    }, TIMEOUT);


    test.each(models)(`${name}: execute prompt on %s`, async (model) => {
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 });
        assertCompletionOk(r);
        //console.log(r);
    }, TIMEOUT);

    test.each(models)(`${name}: execute prompt with streaming on %s`, async (model) => {
        const r = await driver.stream(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 })
        await assertStreamingCompletionOk(r);
    }, TIMEOUT);

    test.each(models)(`${name}: execute prompt with schema on %s`, async (model) => {
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024, resultSchema: testSchema_color });
        assertCompletionOk(r);
        //console.log(r);
    }, TIMEOUT);

});

