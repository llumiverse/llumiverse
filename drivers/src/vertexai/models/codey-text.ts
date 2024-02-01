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

export interface CodeyTextPrompt {
    instances: { prefix: string }[];
    parameters: PromptParamaters;
}

export interface CodeyTextStreamingPrompt {
    inputs: {
        structVal: {
            prefix: {
                stringVal: string
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

export type CodeyTextPrompts = CodeyTextPrompt | CodeyTextStreamingPrompt;

interface CodeyTextResponseMetadata {
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

interface CodeyTextResponsePrediction {
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

export interface CodeyTextResponse {
    predictions: CodeyTextResponsePrediction[],
    metadata: CodeyTextResponseMetadata
}

export const CodeyTextDefinition: ModelDefinition<CodeyTextPrompts> = {
    model: {
        id: "code-bison",
        name: "Codey for Code Generation",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },

    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): CodeyTextPrompt {
        return {
            instances: [{
                prefix: getPromptAsText(segments, opts)
            }],
            parameters: {
                // put defauilts here
            }
        } as CodeyTextPrompt;
    },

    async requestCompletion(driver: VertexAIDriver, prompt: CodeyTextPrompts, options: ExecutionOptions): Promise<Completion> {
        Object.assign((prompt as CodeyTextPrompt).parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const response: CodeyTextResponse = await driver.fetchClient.post(`/publishers/google/models/${this.model.id}:predict`, {
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

    async requestCompletionStream(driver: VertexAIDriver, prompt: CodeyTextPrompts, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const inPrompt = prompt as CodeyTextPrompt;
        Object.assign(inPrompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const path = `/publishers/google/models/${this.model.id}:serverStreamingPredict?alt=sse`;

        const newPrompt = generateStreamingPrompt(inPrompt);

        // we need to modify the existing prompt since it is not the final one
        const outPrompt = prompt as CodeyTextStreamingPrompt;
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
