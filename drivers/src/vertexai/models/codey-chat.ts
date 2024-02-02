import { AIModel, ModelType, PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { VertexAIDriver } from "../index.js";
import { getJSONSafetyNotice } from "../utils/prompts.js";
import { AbstractPalmModelDefinition, NonStreamingPromptBase, PalmResponseMetadata, StreamingPromptBase } from "./palm-model-base.js";

export interface CodeyChatMessage {
    author: string,
    content: string
}

export type CodeyChatPrompt = NonStreamingPromptBase<{
    context?: string;
    messages: CodeyChatMessage[];
}>


export type CodeyChatStreamingPrompt = StreamingPromptBase<{
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


interface CodeyChatResponsePrediction {
    candidates: CodeyChatMessage[],
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

export interface CodeyChatResponse {
    predictions: CodeyChatResponsePrediction[],
    metadata: PalmResponseMetadata
}

export class CodeyChatDefinition extends AbstractPalmModelDefinition<CodeyChatPrompt, CodeyChatStreamingPrompt> {
    versions: string[] = [];
    model: AIModel = {
        id: "codechat-bison",
        name: "Codey for Code Chat",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Chat,
        canStream: true,
    }

    createNonStreamingPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): CodeyChatPrompt {
        const system: string[] = [];
        const messages: CodeyChatMessage[] = [];
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

        if (opts.resultSchema) {
            safety.push(getJSONSafetyNotice(opts.resultSchema));
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
        } as CodeyChatPrompt;
    }

    extractContentFromResponse(response: CodeyChatResponse): string {
        return response.predictions[0].candidates[0].content ?? '';
    }

    extractContentFromResponseChunk(chunk: any): string {
        return chunk.outputs[0]?.structVal.candidates.listVal[0].structVal.content.stringVal || '';
    }

}
