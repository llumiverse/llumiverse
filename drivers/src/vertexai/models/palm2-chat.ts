import { AIModel, ModelType, PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { getJSONSafetyNotice } from "@llumiverse/core/formatters";
import { VertexAIDriver } from "../index.js";
import { AbstractPalmModelDefinition, NonStreamingPromptBase, PalmResponseMetadata, StreamingPromptBase } from "./palm-model-base.js";

export interface Palm2ChatMessage {
    author: string,
    content: string
}

export type Palm2ChatPrompt = NonStreamingPromptBase<{
    context?: string;
    examples?: [
        {
            input: { content: string },
            output: { content: string }
        }
    ],
    messages: Palm2ChatMessage[];
}>


export type Palm2ChatStreamingPrompt = StreamingPromptBase<{
    messages: {
        listVal: {
            structVal: {
                author: {
                    stringVal: string
                },
                content: {
                    stringVal: string
                }
            }
        }[]
    }
}>

interface Palm2ChatResponsePrediction {
    candidates: Palm2ChatMessage[],
    safetyAttributes: {
        scores: number[],
        blocked: boolean,
        categories: string[],
        errors: number[],
    },
    citationMetadata: {
        citations: any[]
    },
    logprobs: any,
}

export interface Palm2ChatResponse {
    predictions: Palm2ChatResponsePrediction[],
    metadata: PalmResponseMetadata
}

export class Palm2ChatDefinition extends AbstractPalmModelDefinition<Palm2ChatPrompt, Palm2ChatStreamingPrompt> {
    versions: string[] = [];
    model: AIModel = {
        id: "chat-bison",
        name: "PaLM 2 for Chat",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Chat,
        canStream: true,
    }

    createNonStreamingPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): Palm2ChatPrompt {
        const system: string[] = [];
        const messages: Palm2ChatMessage[] = [];
        const safety: string[] = [];
        for (const segment of segments) {
            switch (segment.role) {
                case PromptRole.user:
                    messages.push({ author: 'user', content: segment.content });
                    break;
                case PromptRole.assistant:
                    messages.push({ author: 'assistant', content: segment.content });
                    break;
                case PromptRole.system:
                    system.push(segment.content);
                    break;
                case PromptRole.safety:
                    safety.push(segment.content);
                    break;
            }
        }

        if (opts.result_schema) {
            safety.push(getJSONSafetyNotice(opts.result_schema));
        }

        const context = []
        if (system.length > 0) {
            context.push(system.join('\n'));
        }
        if (safety.length > 0) {
            context.push('IMPORTANT: ' + safety.join('\n'));
        }

        return {
            instances: [{
                context: context.length > 0 ? context.join('\n') : undefined,
                messages
            }],
            parameters: {
                // put defauilts here
            }
        } as Palm2ChatPrompt;
    }

    extractContentFromResponse(response: Palm2ChatResponse): string {
        return response.predictions[0].candidates[0].content ?? '';
    }

    extractContentFromResponseChunk(chunk: any): string {
        return chunk.outputs[0]?.structVal.candidates.listVal[0].structVal.content.stringVal || ''
    }
}
