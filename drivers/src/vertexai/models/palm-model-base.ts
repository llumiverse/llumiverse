import { AIModel, Completion, ExecutionOptions, PromptOptions, PromptSegment } from "@llumiverse/core";
import { transformSSEStream } from "@llumiverse/core/async";
import { VertexAIDriver } from "../index.js";
import { ModelDefinition } from "../models.js";
import { PromptParamatersBase } from "../utils/prompts.js";
import { generateStreamingPrompt } from "../utils/tensor.js";

export interface NonStreamingPromptBase<InstanceType = any> {
    instances: InstanceType[];
    parameters: PromptParamatersBase;
}

export interface StreamingPromptBase<InputType = any> {
    inputs: { structVal: InputType }[];
    parameters: {
        structVal: {
            temperature?: { floatval: number },
            maxOutputTokens?: { intVal: number },
            //TODO more params
            [key: string]: Record<string, any> | undefined
        }
    }
}

export interface PalmResponseMetadata {
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


export abstract class AbstractPalmModelDefinition<NonStreamingPromptT extends NonStreamingPromptBase, StreamingPromptT extends StreamingPromptBase> implements ModelDefinition<NonStreamingPromptT | StreamingPromptT> {

    abstract model: AIModel;

    abstract versions?: string[];

    abstract createNonStreamingPrompt(driver: VertexAIDriver, segments: PromptSegment[], options: PromptOptions): NonStreamingPromptT;

    abstract extractContentFromResponse(response: any): string;

    abstract extractContentFromResponseChunk(chunk: any): string;

    createPrompt(driver: VertexAIDriver, segments: PromptSegment[], options: PromptOptions) {
        return this.createNonStreamingPrompt(driver, segments, options);
    }

    async requestCompletion(driver: VertexAIDriver, prompt: NonStreamingPromptT | StreamingPromptT, options: ExecutionOptions): Promise<Completion<any>> {
        const nonStreamingPrompt = prompt as NonStreamingPromptT;
        Object.assign((nonStreamingPrompt).parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const response = await driver.fetchClient.post(`/publishers/google/models/${this.model.id}:predict`, {
            payload: nonStreamingPrompt
        });

        const metadata = response.metadata as PalmResponseMetadata;
        const inputTokens = metadata.tokenMetadata.inputTokenCount.totalTokens;
        const outputTokens = metadata.tokenMetadata.outputTokenCount.totalTokens;
        const result = this.extractContentFromResponse(response);
        return {
            result,
            token_usage: {
                prompt: inputTokens,
                result: outputTokens,
                total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined,
            }
        } as Completion;

    }

    async requestCompletionStream(driver: VertexAIDriver, prompt: NonStreamingPromptT | StreamingPromptT, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const inPrompt = prompt as NonStreamingPromptT;
        Object.assign(inPrompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const path = `/publishers/google/models/${this.model.id}:serverStreamingPredict?alt=sse`;

        const newPrompt = generateStreamingPrompt(inPrompt);

        // we need to modify the existing prompt since it is not the final one
        const outPrompt = prompt as StreamingPromptT;
        delete (outPrompt as any).instances;
        outPrompt.inputs = newPrompt.inputs;
        outPrompt.parameters = newPrompt.parameters;

        const eventStrean = await driver.fetchClient.post(path, {
            payload: newPrompt,
            reader: 'sse'
        });

        return transformSSEStream(eventStrean, (data: string) => {
            const json = JSON.parse(data);
            const stringChunk = this.extractContentFromResponseChunk(json);
            return Array.isArray(stringChunk) ? stringChunk.join('') : stringChunk;
        })
    }

}

