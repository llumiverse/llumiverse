import { Driver } from '@llumiverse/core';
import { describe, test, expect } from "vitest";
import { VertexAIDriver } from "../src/index.js";

const TIMEOUT = 10000;
const TEXT = "Hello";

describe('VertexAI: Test embeddings generation', function () {
    const driver = new VertexAIDriver({
        project: "dengenlabs",
        region: "us-central1"
    }) as Driver;
    test('embeddings for text', async () => {
        const r = await driver.generateEmbeddings({ content: TEXT });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("textembedding-gecko@latest");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
    test('embeddings for text with options', async () => {
        const r = await driver.generateEmbeddings({ content: TEXT, model: "textembedding-gecko@002" });
        expect(r.values.length).toBeGreaterThan(0);
        expect(r.model).toBe("textembedding-gecko@002");
        expect(r.token_count).toBe(1);
    }, TIMEOUT);
})
