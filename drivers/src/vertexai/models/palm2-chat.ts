import { Completion, ExecutionOptions, ModelType, PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { ParsedEvent } from "eventsource-parser";
import { VertexAIDriver } from "../index.js";
import { ModelDefinition } from "../models.js";
import { PromptParamatersBase, getJSONSafetyNotice } from "../utils/prompts.js";
import { sse } from "../utils/sse.js";
import { generateStreamingPrompt } from "../utils/tensor.js";

export interface Palm2ChatMessage {
    author: string,
    content: string
}
export interface Palm2ChatPrompt {
    instances: {
        context?: string;
        examples?: [
            {
                input: { content: string },
                output: { content: string }
            }
        ],
        messages: Palm2ChatMessage[];
    }[];
    parameters: PromptParamatersBase
}

export interface Palm2ChatStreamingPrompt {
    inputs: {
        structVal: {
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
        }
    }[],
    parameters: {
        structVal: {
            temperature?: { floatval: number },
            maxOutputTokens?: { intVal: number },
            //TODO more params
            [key: string]: Record<string, any> | undefined
        }
    }
}

export type Palm2ChatPrompts = Palm2ChatPrompt | Palm2ChatStreamingPrompt;

// TODO this interface is the same as palm2-text.ts
interface Palm2ChatResponseMetadata {
    tokenMetadata: {
        outputTokenCount: {
            totalBillableCharacters: number,
            totalTokens: number
        },
        inputTokenCount: {
            totalBillableCharacters: number,
            totalTokens: number
        }
    }
}

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
    metadata: Palm2ChatResponseMetadata
}

export const Palm2ChatDefinition: ModelDefinition<Palm2ChatPrompts> = {
    model: {
        id: "chat-bison",
        name: "PaLM 2 Chat Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Chat,
    },

    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): Palm2ChatPrompt {
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
        } as Palm2ChatPrompt;
    },

    async requestCompletion(driver: VertexAIDriver, prompt: Palm2ChatPrompts, options: ExecutionOptions): Promise<Completion> {
        Object.assign((prompt as Palm2ChatPrompt).parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const response: Palm2ChatResponse = await driver.fetchClient.post(`/publishers/google/models/${this.model.id}:predict`, {
            payload: prompt
        });

        const metadata = response.metadata;
        const inputTokens = metadata.tokenMetadata.inputTokenCount.totalTokens;
        const outputTokens = metadata.tokenMetadata.outputTokenCount.totalTokens;
        // TODO only  this line differs from palm2-text.ts
        const result = response.predictions[0].candidates[0].content ?? '';
        return {
            result,
            token_usage: {
                prompt: inputTokens,
                result: outputTokens,
                total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined,
            }
        } as Completion;
    },

    async requestCompletionStream(driver: VertexAIDriver, prompt: Palm2ChatPrompts, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const inPrompt = prompt as Palm2ChatPrompt;
        Object.assign(inPrompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const path = `/publishers/google/models/${this.model.id}:serverStreamingPredict?alt=sse`;

        const newPrompt = generateStreamingPrompt(inPrompt);

        //TODO the tensor formatter is not wrapping messages in a listVal which is required for the streaming api
        // I am not sure how to automatically format this to add a listVal for object lists like messages but 
        // without adding the listVal for inputs lists

        // we need to modify the existing prompt since it is not the final one
        const outPrompt = prompt as Palm2ChatStreamingPrompt;
        delete (outPrompt as any).instances;
        outPrompt.inputs = newPrompt.inputs;
        outPrompt.parameters = newPrompt.parameters;

        const eventStrean = await driver.fetchClient.post(path, {
            payload: newPrompt,
            reader: sse
        });
        return eventStrean.pipeThrough(new MyTransformStream());
    }
}

class MyTransformStream extends TransformStream {
    constructor() {
        super({
            transform(event: ParsedEvent, controller: TransformStreamDefaultController) {
                if (event.type === 'event' && event.data) {
                    const data = JSON.parse(event.data);
                    controller.enqueue(data.outputs[0]?.structVal.candidates.listVal[0].structVal.content.stringVal || '');
                }
            }
        })
    }
}
