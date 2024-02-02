import { Content, GenerateContentRequest, GenerativeModel, HarmBlockThreshold, HarmCategory, TextPart } from "@google-cloud/vertexai";
import { AIModel, Completion, ExecutionOptions, ExecutionTokenUsage, ModelType, PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { asyncMap } from "@llumiverse/core/async";
import { VertexAIDriver } from "../index.js";
import { ModelDefinition } from "../models.js";

function getGenerativeModel(driver: VertexAIDriver, options: ExecutionOptions): GenerativeModel {
    return driver.vertexai.preview.getGenerativeModel({
        model: options.model,
        //TODO pass in the options
        safety_settings: [{
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }],
        generation_config: {
            temperature: options.temperature,
            max_output_tokens: options.max_tokens
        },
    });
}


function collectTextParts(content: Content) {
    const out = [];
    const parts = content.parts;
    if (parts) {
        for (const part of parts) {
            if (part.text) {
                out.push(part.text);
            }
        }
    }
    return out.join('\n');
}

export class GeminiModelDefinition implements ModelDefinition<GenerateContentRequest> {

    model: AIModel = {
        id: "gemini-pro",
        name: "Gemini Pro",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
        canStream: true,
    }

    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], options: PromptOptions): GenerateContentRequest {
        const schema = options.resultSchema;
        const contents: Content[] = [];
        const safety: string[] = [];

        let lastUserContent: Content | undefined = undefined;
        for (const msg of segments) {
            if (msg.role === PromptRole.safety) {
                safety.push(msg.content);
            } else {
                const role = msg.role === PromptRole.assistant ? "model" : "user";
                if (lastUserContent && lastUserContent.role === role) {
                    lastUserContent.parts.push({ text: msg.content } as TextPart);
                } else {
                    const content: Content = {
                        role,
                        parts: [{ text: msg.content } as TextPart],
                    }
                    if (role === 'user') {
                        lastUserContent = content;
                    }
                    contents.push(content);
                }
            }
        }

        let tools: any = undefined;
        if (schema) {

            // tools = [{
            //     function_declarations: [{
            //         name: "validate_json_response",
            //         description: "Validate the given JSON response",
            //         parameters: schema as any,
            //     }]
            // } as Tool];

            safety.push("The answer must be a JSON object using the following JSON Schema:\n" + JSON.stringify(schema));
        }

        if (safety.length > 0) {
            const content = safety.join('\n');
            if (lastUserContent) {
                lastUserContent.parts.push({ text: content } as TextPart);
            } else {
                contents.push({
                    role: 'user',
                    parts: [{ text: content } as TextPart],
                })
            }
        }

        // put system mesages first and safety last
        return { contents, tools } as GenerateContentRequest;
    }

    async requestCompletion(driver: VertexAIDriver, prompt: GenerateContentRequest, options: ExecutionOptions): Promise<Completion> {
        const model = getGenerativeModel(driver, options);
        const r = await model.generateContent(prompt);
        const response = await r.response;
        const usage = response.usageMetadata;
        const token_usage: ExecutionTokenUsage = {
            prompt: usage?.prompt_token_count,
            result: usage?.candidates_token_count,
            total: usage?.totalTokenCount,
        }

        let result: any;
        const candidate = response.candidates[0];
        if (candidate) {
            const content = candidate.content;
            if (content) {
                result = collectTextParts(content);
                // if (options.resultSchema) {
                //     result = candidate.;
                // } else {
                // }
            }
        }

        return {
            result: result ?? '',
            token_usage
        };
    }

    async requestCompletionStream(driver: VertexAIDriver, prompt: GenerateContentRequest, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const model = getGenerativeModel(driver, options);
        const streamingResp = await model.generateContentStream(prompt);

        const stream = asyncMap(streamingResp.stream, async (item) => {
            if (item.candidates.length > 0) {
                for (const candidate of item.candidates) {
                    if (candidate.content?.role === 'model') {
                        const text = collectTextParts(candidate.content);
                        if (text) return text;
                    }
                }
            }
            return '';
        });

        return stream;
    }

}