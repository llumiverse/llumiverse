import { Content, FileDataPart, FinishReason, GenerateContentRequest, HarmBlockThreshold, HarmCategory, TextPart } from "@google-cloud/vertexai";
import { AIModel, Completion, ExecutionOptions, ExecutionTokenUsage, PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { asyncMap } from "@llumiverse/core/async";
import { VertexAIDriver } from "../index.js";
import { BuiltinModels, ModelDefinition } from "../models.js";

function getGenerativeModel(driver: VertexAIDriver, options: ExecutionOptions) {
    return driver.vertexai.preview.getGenerativeModel({
        model: options.model,
        //TODO pass in the options      
        safetySettings: [{
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }],
        generationConfig: {
            candidateCount: 1,
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens
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

    model: AIModel

    constructor(modelId: string = "gemini-1.0-pro") {

        const model = BuiltinModels.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unknown model ${modelId}`);
        }
        this.model = model;

    }


    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], options: PromptOptions): GenerateContentRequest {
        const schema = options.result_schema;
        const contents: Content[] = [];
        const safety: string[] = [];

        let lastUserContent: Content | undefined = undefined;


        for (const msg of segments) {

           


            if (msg.role === PromptRole.safety) {
                safety.push(msg.content);
            } else {
                const fileParts: (TextPart|FileDataPart)[]|undefined = msg.files?.map( f => {
                    return {
                        fileData: {
                            fileUri: f.url,
                            mimeType: f.type
                        }
                    } as FileDataPart
                })

                const role = msg.role === PromptRole.assistant ? "model" : "user";

                if (lastUserContent && lastUserContent.role === role) {
                    lastUserContent.parts.push({ text: msg.content } as TextPart);
                    fileParts?.forEach(p => lastUserContent?.parts.push(p));
                } else {
                    const content: Content = {
                        role,
                        parts: [{ text: msg.content } as TextPart],
                    }
                    fileParts?.forEach(p => content.parts.push(p));

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
            prompt: usage?.promptTokenCount,
            result: usage?.candidatesTokenCount,
            total: usage?.totalTokenCount,
        }

        let finish_reason: string | undefined, result: any;
        const candidate = response.candidates && response.candidates[0];
        if (candidate) {
            switch (candidate.finishReason) {
                case FinishReason.MAX_TOKENS: finish_reason = "length"; break;
                case FinishReason.STOP: finish_reason = "stop"; break;
                default: finish_reason = candidate.finishReason;
            }
            const content = candidate.content;
            if (content) {
                result = collectTextParts(content);
                // if (options.result_schema) {
                //     result = candidate.;
                // } else {
                // }
            }
        }

        return {
            result: result ?? '',
            token_usage,
            finish_reason,
            original_response: options.include_original_response ? response : undefined,
        } as Completion;
    }

    async requestCompletionStream(driver: VertexAIDriver, prompt: GenerateContentRequest, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const model = getGenerativeModel(driver, options);
        const streamingResp = await model.generateContentStream(prompt);

        const stream = asyncMap(streamingResp.stream, async (item) => {
            if (item.candidates && item.candidates.length > 0) {
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