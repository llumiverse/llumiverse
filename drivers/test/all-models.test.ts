import { AbstractDriver } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { BedrockDriver, GroqDriver, MistralAIDriver, OpenAIDriver, TogetherAIDriver, VertexAIDriver, WatsonxDriver } from '../src';
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
            "cohere.command-r-plus-v1:0"
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
            "llama3-70b-8192",
            "mixtral-8x7b-32768"
        ]
    })
} else {
    console.warn("Groq tests are skipped: GROQ_API_KEY environment variable is not set");
}


if (process.env.WATSONX_API_KEY) {

    drivers.push({
        name: "watsonx",
        driver: new WatsonxDriver({
            apiKey: process.env.WATSONX_API_KEY as string,
            projectId: process.env.WATSONX_PROJECT_ID as string,
            endpointUrl: process.env.WATSONX_ENDPOINT_URL as string
        }),
        models: [
            "ibm/granite-8b-code-instruct",
            "ibm/granite-20b-multilingual",
            "ibm/granite-34b-code-instruct",
            "ibm/granite-20b-code-instruct",
            "mistralai/mixtral-8x7b-instruct-v01"
        ]
    })
} else {
    console.warn("Groq tests are skipped: WATSONX_API_KEY environment variable is not set");
}


if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_REGION) {
    drivers.push({
        name: "google-vertex",
        driver: new VertexAIDriver({
            project: process.env.GOOGLE_PROJECT_ID as string,
            region: process.env.GOOGLE_REGION as string,
        }),
        models: [
            "gemini-1.5-flash-preview-0514",
            "gemini-1.5-pro-preview-0514",
            "gemini-1.0-pro"
        ]
    })
}

describe.concurrent.each(drivers)("Driver $name", ({ name, driver, models }) => {

    test(`${name}: list models`, async () => {
        const r = await driver.listModels();
        //console.log(r)
        expect(r.length).toBeGreaterThan(0);
    }, { timeout: TIMEOUT, retry: 1 } );


    test.each(models)(`${name}: execute prompt on %s`, async (model) => {
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 });
        console.debug("Result for " + model, JSON.stringify(r));
        assertCompletionOk(r);
    }, { timeout: TIMEOUT, retry: 3 } );

    test.each(models)(`${name}: execute prompt with streaming on %s`, async (model) => {
        console.log("Executing with streaming", testPrompt_color)   
        const r = await driver.stream(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024 })
        const out = await assertStreamingCompletionOk(r);
        console.debug("Result for " + model, JSON.stringify(out));
    }, { timeout: TIMEOUT, retry: 3 } );

    test.each(models)(`${name}: execute prompt with schema on %s`, async (model) => {
        console.log("Executing with schema", testPrompt_color)
        const r = await driver.execute(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024, resultSchema: testSchema_color });
        console.debug("Result for " + model, JSON.stringify(r.result));
        assertCompletionOk(r);
    }, { timeout: TIMEOUT, retry: 3 } );

    test.each(models)(`${name}: execute prompt with streaming and schema on %s`, async (model) => {
        console.log("Executing with streaming and schema", testPrompt_color, testSchema_color)
        const r = await driver.stream(testPrompt_color, { model, temperature: 0.8, max_tokens: 1024, resultSchema: testSchema_color})
        const out = await assertStreamingCompletionOk(r, true);
        console.debug("Result for " + model, JSON.stringify(out));
    }, { timeout: TIMEOUT, retry: 3 } );

});

