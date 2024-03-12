//import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Driver } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { BedrockDriver, OpenAIDriver, VertexAIDriver } from "../src/index.js";

const TIMEOUT = 10000;
const TEXT = "Hello";

// const credentials = defaultProvider({
//     profile: "default",
// })

const vertex = new VertexAIDriver({
    project: "dengenlabs",
    region: "us-central1"
}) as Driver;
const bedrock = new BedrockDriver({
    region: 'us-west-2',
    //credentials: credentials
});
const openai = new OpenAIDriver({
    apiKey: process.env.OPENAI_API_KEY as string
});


describe('VertexAI: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await vertex.generateEmbeddings({ content: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("textembedding-gecko@latest");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
    test('embeddings for text with options', async () => {
        const r = await vertex.generateEmbeddings({ content: TEXT, model: "textembedding-gecko@002" });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("textembedding-gecko@002");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
})

describe('Bedrock: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await bedrock.generateEmbeddings({ content: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("amazon.titan-embed-text-v1");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
})

describe('OpenAI: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await openai.generateEmbeddings({ content: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("text-embedding-ada-002");
        expect(r.token_count).toBeUndefined(); // not reported nby openai
    }, TIMEOUT);
})

