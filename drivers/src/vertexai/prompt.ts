import { Content, GenerateContentRequest, GenerativeModel, HarmBlockThreshold, HarmCategory, TextPart, VertexAI } from "@google-cloud/vertexai";
import { ExecutionOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { JSONSchema4 } from "json-schema";

export function getGenerativeModel(vertexai: VertexAI, options: ExecutionOptions): GenerativeModel {
    return vertexai.preview.getGenerativeModel({
        model: options.model,
        //TODO pass in the options
        safety_settings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }],
        generation_config: {
            temperature: options.temperature,
            max_output_tokens: options.max_tokens
        },
    });
}

export function formatPrompt(segments: PromptSegment[], schema?: JSONSchema4): GenerateContentRequest {
    const others: Content[] = [];
    const safety: Content[] = [];

    for (const msg of segments) {
        if (msg.role === PromptRole.safety) {
            safety.push({
                role: "user",
                parts: [{ text: msg.content } as TextPart],
            });
        } else {
            others.push({
                role: msg.role === PromptRole.assistant ? "model" : "user",
                parts: [{ text: msg.content } as TextPart],
            });
        }
    }

    if (schema) {
        others.push({
            role: "user",
            parts: [{
                text: "You must answer using the following JSONSchema:\n" + JSON.stringify(schema)
            } as TextPart],
        })
    }

    // put system mesages first and safety last
    return { contents: others.concat(safety) };
}
