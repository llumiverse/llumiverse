//import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Driver } from '@llumiverse/core';
import 'dotenv/config';
import { describe, expect, test } from "vitest";
import { BedrockDriver, MistralAIDriver, OpenAIDriver, VertexAIDriver, WatsonxDriver } from "../src/index.js";

const TIMEOUT = 15000;
const TEXT = "Hello";

const IMAGE_SRC = import.meta.dirname + "/hello_world.jpg";

const fs = require('fs').promises;

async function convertImageToBase64(path: string) {
    const data = await fs.readFile(path);
    let base64Image = Buffer.from(data, 'binary').toString('base64');
    return base64Image;
}

const IMAGE = await convertImageToBase64(IMAGE_SRC);

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
const mistral = new MistralAIDriver({
    apiKey: process.env.MISTRAL_API_KEY as string
});

const watsonx = new WatsonxDriver({
    apiKey: process.env.WATSONX_API_KEY as string,
    projectId: process.env.WATSONX_PROJECT_ID as string,
    endpointUrl: process.env.WATSONX_ENDPOINT_URL as string
});


describe('VertexAI: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await vertex.generateEmbeddings({ text: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("text-embedding-004");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
    test('embeddings for text with multimodal', async () => {
        const r = await vertex.generateEmbeddings({ text: TEXT, model: "multimodalembedding@001" });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("multimodalembedding@001");
        expect(r.token_count).toBeUndefined();      //not reported by multimodal
    }, TIMEOUT);
    test('embeddings for image', async () => {
        const r = await vertex.generateEmbeddings({ image: IMAGE });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("multimodalembedding@001");
        expect(r.token_count).toBeUndefined()   //not reported by multimodal
    }, TIMEOUT);
})

describe('Bedrock: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await bedrock.generateEmbeddings({ text: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("amazon.titan-embed-text-v2:0");
        expect(r.token_count).toBeGreaterThan(0);
    }, TIMEOUT);

    test('embeddings for image and text', async () => {
        const r = await bedrock.generateEmbeddings({ text: TEXT, image: IMAGE });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("amazon.titan-embed-image-v1");
    }, TIMEOUT);

})

describe('OpenAI: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await openai.generateEmbeddings({ text: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("text-embedding-3-small");
        expect(r.token_count).toBeUndefined(); // not reported by openai
    }, TIMEOUT);
})

describe('MistralAI: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await mistral.generateEmbeddings({ text: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("mistral-embed");
        expect(r.token_count).toBeGreaterThan(0);
    }, TIMEOUT);
})

describe('Watsonx: embeddings generation', function () {
    test('embeddings for text', async () => {
        const r = await watsonx.generateEmbeddings({ text: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("ibm/slate-125m-english-rtrvr");
        expect(r.token_count).toBeUndefined(); // not reported by watsonx      
    }, TIMEOUT);
})
