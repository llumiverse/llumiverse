import { Completion, ExecutionOptions, ModelType, PromptOptions, PromptSegment } from "@llumiverse/core";
import { ParsedEvent } from "eventsource-parser";
import { VertexAIDriver } from "../index.js";
import { ModelDefinition } from "../models.js";
import { PromptParamatersBase, getPromptAsText } from "../utils/prompts.js";
import { sse } from "../utils/sse.js";
import { generateStreamingPrompt } from "../utils/tensor.js";

interface PromptParamaters extends PromptParamatersBase {
    echo?: boolean
}

export interface Palm2TextPrompt {
    instances: { prompt: string }[];
    parameters: PromptParamaters;
}

export interface Palm2TextStreamingPrompt {
    inputs: {
        structVal: {
            content: {
                stringVal: string | string[]
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

export type Palm2TextPrompts = Palm2TextPrompt | Palm2TextStreamingPrompt;

interface Palm2TextResponseMetadata {
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

interface Palm2TextResponsePrediction {
    content: string,
    safetyAttributes: {
        scores: number[],
        safetyRatings: {
            severity: string,
            probabilityScore: number,
            severityScore: number,
            category: string
        }[]
    },
    citationMetadata: {
        citations: any[]
    }
}

export interface Palm2TextResponse {
    predictions: Palm2TextResponsePrediction[],
    metadata: Palm2TextResponseMetadata
}

export const Palm2TextDefinition: ModelDefinition<Palm2TextPrompts> = {
    model: {
        id: "text-bison",
        name: "PaLM 2 Text Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },

    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): Palm2TextPrompt {
        return {
            instances: [{
                prompt: getPromptAsText(segments, opts)
            }],
            parameters: {
                // put defauilts here
            }
        } as Palm2TextPrompt;
    },

    async requestCompletion(driver: VertexAIDriver, prompt: Palm2TextPrompts, options: ExecutionOptions): Promise<Completion> {
        Object.assign((prompt as Palm2TextPrompt).parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const response: Palm2TextResponse = await driver.fetchClient.post(`/publishers/google/models/${this.model.id}:predict`, {
            payload: prompt
        });

        const metadata = response.metadata;
        const inputTokens = metadata.tokenMetadata.inputTokenCount.totalTokens;
        const outputTokens = metadata.tokenMetadata.outputTokenCount.totalTokens;
        const result = response.predictions[0].content ?? '';
        return {
            result,
            token_usage: {
                prompt: inputTokens,
                result: outputTokens,
                total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined,
            }
        } as Completion;
    },

    async requestCompletionStream(driver: VertexAIDriver, prompt: Palm2TextPrompts, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const inPrompt = prompt as Palm2TextPrompt;
        Object.assign(inPrompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const path = `/publishers/google/models/${this.model.id}:serverStreamingPredict?alt=sse`;

        const newPrompt = generateStreamingPrompt(inPrompt);

        // we need to modify the existing prompt since it is not the final one
        const outPrompt = prompt as Palm2TextStreamingPrompt;
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
                    controller.enqueue(data.outputs[0]?.structVal.content.stringVal || '');
                }
            }
        })
    }
}
