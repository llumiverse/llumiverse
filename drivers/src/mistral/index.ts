import { AIModel, AbstractDriver, Completion, DriverOptions, ExecutionOptions, PromptFormats, PromptSegment } from "@llumiverse/core";
import { transformAsyncIterator } from "@llumiverse/core/async";
import MistralClient, { ResponseFormat } from "@mistralai/mistralai";


interface MistralAIDriverOptions extends DriverOptions {
    apiKey: string;
    endpointUrl: string;
}

export class MistralAIDriver extends AbstractDriver<MistralAIDriverOptions, LLMMessage[]> {
    provider: string;
    apiKey: string;
    defaultFormat: PromptFormats;
    client: MistralClient;
    endpointUrl?: string;

    constructor(options: MistralAIDriverOptions) {
        super(options);
        this.provider = "MistralAI";
        this.defaultFormat = PromptFormats.genericTextLLM;
        this.apiKey = options.apiKey;
        this.client = new MistralClient(options.apiKey, options.endpointUrl);
    }

    getResponseFormat = (options: ExecutionOptions): ResponseFormat | undefined => {


        const responseFormatJson: ResponseFormat = {
            type: "json_object",
        } as ResponseFormat

        const responseFormatText: ResponseFormat = {
            type: "text",
        } as ResponseFormat;

        //return options.resultSchema ? responseFormatJson : responseFormatText;

        return undefined //TODO remove this when Mistral properly supports the parameters
    }

    createPrompt(segments: PromptSegment[], opts: ExecutionOptions): LLMMessage[] {
        // use same format as OpenAI as that's what MistralAI uses
        const prompts = super.createPrompt(segments, { ...opts, format: PromptFormats.openai })

        //Add JSON instruction is schema is provided
        if (opts.resultSchema) {
            const content = "The user is explicitely instructing that the result should be a JSON object.\nThe schema is as follows: \n" + JSON.stringify(opts.resultSchema);
            prompts.push({
                role: "user",
                content: JSON.stringify({ schema: opts.resultSchema })
            });
        }

        return prompts;

    }

    async requestCompletion(messages: LLMMessage[], options: ExecutionOptions): Promise<Completion<any>> {

        const start = Date.now();
        const res = await this.client.chat({
            model: options.model,
            messages: messages,
            maxTokens: options.max_tokens ?? 1024,
            temperature: options.temperature ?? 0.7,
            responseFormat: this.getResponseFormat(options),
        })

        const elapsed = Date.now() - start;
        const result = res.choices[0]?.message.content;

        return {
            result: result,
            execution_time: elapsed / 1000,
            token_usage: {
                prompt: res.usage.prompt_tokens,
                result: res.usage.completion_tokens,
                total: res.usage.total_tokens,
            }
        };
    }

    async requestCompletionStream(messages: LLMMessage[], options: ExecutionOptions): Promise<AsyncIterable<string>> {



        const stream = this.client.chatStream({
            model: options.model,
            messages: messages,
            maxTokens: options.max_tokens ?? 1024,
            temperature: options.temperature ?? 0.7,
            responseFormat: this.getResponseFormat(options),
        });

        return transformAsyncIterator(stream, (res) => {
            return res.choices[0].delta.content || '';
        });
    }

    async listModels(): Promise<AIModel<string>[]> {

        const models = await this.client.listModels();

        const aimodels = models.data.map(m => {
            return {
                id: m.id,
                name: m.id,
                description: undefined,
                provider: m.owned_by,
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

interface LLMMessage {
    role: string;
    content: string;
}