import { AIModel, AbstractDriver, Completion, DriverOptions, EmbeddingsResult, ExecutionOptions, CompletionChunk } from "@llumiverse/core";
import { transformSSEStream } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";
import { TextCompletion, TogetherModelInfo } from "./interfaces.js";

interface TogetherAIDriverOptions extends DriverOptions {
    apiKey: string;
}

export class TogetherAIDriver extends AbstractDriver<TogetherAIDriverOptions, string> {
    static PROVIDER = "togetherai";
    provider = TogetherAIDriver.PROVIDER;
    apiKey: string;
    fetchClient: FetchClient;

    constructor(options: TogetherAIDriverOptions) {
        super(options);
        this.apiKey = options.apiKey;
        this.fetchClient = new FetchClient('https://api.together.xyz').withHeaders({
            authorization: `Bearer ${this.apiKey}`
        });
    }

    getResponseFormat = (options: ExecutionOptions): { type: string; schema: any } | undefined => {
        return options.result_schema ?
            {
                type: "json_object",
                schema: options.result_schema
            } : undefined;
    }

    async requestCompletion(prompt: string, options: ExecutionOptions): Promise<Completion<any>> {

        const stop_seq = typeof options.stop_sequence == 'string' ? 
            [options.stop_sequence] : options.stop_sequence ?? [];

        const res = await this.fetchClient.post('/v1/completions', {
            payload: {
                model: options.model,
                prompt: prompt,
                response_format: this.getResponseFormat(options),
                max_tokens: options.max_tokens,
                temperature: options.temperature,
                top_p: options.top_p,
                top_k: options.top_k,
                //logprobs: options.top_logprobs,       //Logprobs output currently not supported
                frequency_penalty: options.frequency_penalty,
                presence_penalty: options.presence_penalty,
                stop: [
                    "</s>",
                    "[/INST]",
                    ...stop_seq,
                ],
            }
        }) as TextCompletion;
        const choice = res.choices[0];
        const text = choice.text ?? '';
        const usage = res.usage || {};
        return {
            result: text,
            token_usage: {
                prompt: usage.prompt_tokens,
                result: usage.completion_tokens,
                total: usage.total_tokens,
            },
            finish_reason: choice.finish_reason,                //Uses expected "stop" , "length" format
            original_response: options.include_original_response ? res : undefined,
        }
    }

    async requestCompletionStream(prompt: string, options: ExecutionOptions): Promise<AsyncIterable<CompletionChunk>> {
        const stop_seq = typeof options.stop_sequence == 'string' ? 
            [options.stop_sequence] : options.stop_sequence ?? [];

        const stream = await this.fetchClient.post('/v1/completions', {
            payload: {
                model: options.model,
                prompt: prompt,
                max_tokens: options.max_tokens,
                temperature: options.temperature,
                response_format: this.getResponseFormat(options),
                top_p: options.top_p,
                top_k: options.top_k,
                //logprobs: options.top_logprobs,       //Logprobs output currently not supported
                frequency_penalty: options.frequency_penalty,
                presence_penalty: options.presence_penalty,
                stream: true,
                stop: [
                    "</s>",
                    "[/INST]",
                    ...stop_seq,
                ],
            },
            reader: 'sse'
        })

        return transformSSEStream(stream, (data: string) => {
            const json = JSON.parse(data);
            return {
                result: json.choices[0]?.text ?? '',
                finish_reason: json.choices[0]?.finish_reason,          //Uses expected "stop" , "length" format
                token_usage: {
                    prompt: json.usage?.prompt_tokens,
                    result: json.usage?.completion_tokens,
                    total: json.usage?.prompt_tokens + json.usage?.completion_tokens,
                }
            };
        });

    }

    async listModels(): Promise<AIModel<string>[]> {
        const models: TogetherModelInfo[] = await this.fetchClient.get("/models/info");
        //        logObject('#### LIST MODELS RESULT IS', models[0]);

        const aimodels = models.map(m => {
            return {
                id: m.name,
                name: m.display_name,
                description: m.description,
                provider: this.provider,
            }
        });

        return aimodels;

    }

    validateConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    generateEmbeddings(): Promise<EmbeddingsResult> {
        throw new Error("Method not implemented.");
    }

}