import { AIModel, AbstractDriver, Completion, DriverOptions, ExecutionOptions, PromptFormats } from "@llumiverse/core";
import { FetchClient, ServerSideEvent, sse } from "api-fetch-client";
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

    async requestCompletion(prompt: string, options: ExecutionOptions): Promise<Completion<any>> {
        const res = await this.fetchClient.post('/v1/completions', {
            payload: {
                model: options.model,
                prompt: prompt,
                max_tokens: options.max_tokens ?? 1024,
                temperature: options.temperature ?? 0.7,
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
                stream: true,
            },
            reader: sse
        })

        return stream.pipeThrough(new TransformStream<ServerSideEvent, string>({
            transform(event: ServerSideEvent, controller) {
                if (event.type === 'event' && event.data && event.data !== '[DONE]') {
                    try {
                        const data = JSON.parse(event.data);
                        controller.enqueue(data.choices[0]?.text ?? '');
                    } catch (err) {
                        // double check for the last event whicb is not a JSON - at this time togetherai returrns the string [DONE]
                        // do nothing - happens if data is not a JSON - the last event data is the [DONE] string
                    }
                }
            }
        }));

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

    listTrainableModels(): Promise<AIModel<string>[]> {
        throw new Error("Method not implemented.");
    }
    validateConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    //@ts-ignore
    generateEmbeddings(content: string, model?: string | undefined): Promise<{ embeddings: number[]; model: string; }> {
        throw new Error("Method not implemented.");
    }

}