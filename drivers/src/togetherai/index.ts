import { AIModel, AbstractDriver, Completion, DriverOptions, EmbeddingsResult, ExecutionOptions, PromptFormats } from "@llumiverse/core";
import { transformSSEStream } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";
import { TogetherModelInfo } from "./interfaces.js";

interface TogetherAIDriverOptions extends DriverOptions {
    apiKey: string;
}

export class TogetherAIDriver extends AbstractDriver<TogetherAIDriverOptions, string> {
    provider: string;
    apiKey: string;
    defaultFormat: PromptFormats;
    fetchClient: FetchClient;

    constructor(options: TogetherAIDriverOptions) {
        super(options);
        this.provider = "togetherai";
        this.defaultFormat = PromptFormats.genericTextLLM;
        this.apiKey = options.apiKey;
        this.fetchClient = new FetchClient('https://api.together.xyz').withHeaders({
            authorization: `Bearer ${this.apiKey}`
        });
    }

    getResponseFormat = (options: ExecutionOptions) => {
        return options.resultSchema ?
            {
                type: "json_object",
                schema: options.resultSchema
            } : undefined;
    }

    async requestCompletion(prompt: string, options: ExecutionOptions): Promise<Completion<any>> {
        const res = await this.fetchClient.post('/v1/completions', {
            payload: {
                model: options.model,
                prompt: prompt,
                response_format: this.getResponseFormat(options),
                max_tokens: options.max_tokens ?? 1024,
                temperature: options.temperature ?? 0.7,
                stop: [
                    "</s>",
                    "[/INST]"
                ],
            }
        })

        const text = res.choices[0]?.text ?? '';
        const usage = res.usage || {};
        return {
            result: text,
            token_usage: {
                prompt: usage.prompt_tokens,
                result: usage.completion_tokens,
                total: usage.total_tokens,
            },
        }
    }

    async requestCompletionStream(prompt: string, options: ExecutionOptions): Promise<AsyncIterable<string>> {

        const stream = await this.fetchClient.post('/v1/completions', {
            payload: {
                model: options.model,
                prompt: prompt,
                max_tokens: options.max_tokens ?? 1024,
                temperature: options.temperature ?? 0.7,
                response_format: this.getResponseFormat(options),
                stream: true,
                stop: [
                    "</s>",
                    "[/INST]"
                ],
            },
            reader: 'sse'
        })

        return transformSSEStream(stream, (data: string) => {
            const json = JSON.parse(data);
            return json.choices[0]?.text ?? '';
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
                formats: [PromptFormats.genericTextLLM],
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