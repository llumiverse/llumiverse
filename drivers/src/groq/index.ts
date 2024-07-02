import { AIModel, AbstractDriver, Completion, DriverOptions, EmbeddingsOptions, EmbeddingsResult, ExecutionOptions, PromptSegment } from "@llumiverse/core";
import { transformAsyncIterator } from "@llumiverse/core/async";
import { OpenAITextMessage, formatOpenAILikePrompt, getJSONSafetyNotice } from "@llumiverse/core/formatters";
import Groq from "groq-sdk";


interface GroqDriverOptions extends DriverOptions {
    apiKey: string;
    endpoint_url?: string;
}


export class GroqDriver extends AbstractDriver<GroqDriverOptions, OpenAITextMessage[]> {
    static PROVIDER = "groq";
    provider = GroqDriver.PROVIDER;
    apiKey: string;
    client: Groq;
    endpointUrl?: string;

    constructor(options: GroqDriverOptions) {
        super(options);
        this.apiKey = options.apiKey;
        this.client = new Groq({
            apiKey: options.apiKey,
            baseURL: options.endpoint_url
        });
    }

    // protected canStream(options: ExecutionOptions): Promise<boolean> {
    //     if (options.result_schema) {
    //         // not yet streamign json responses
    //         return Promise.resolve(false);
    //     } else {
    //         return Promise.resolve(true);
    //     }
    // }

    getResponseFormat(_options: ExecutionOptions): Groq.Chat.Completions.CompletionCreateParams.ResponseFormat | undefined {
        //TODO: when forcing json_object type the streaming is not supported.
        // either implement canStream as above or comment the code below:
        // const responseFormatJson: Groq.Chat.Completions.CompletionCreateParams.ResponseFormat = {
        //     type: "json_object",
        // }

        // return _options.result_schema ? responseFormatJson : undefined;
        return undefined;
    }

    protected formatPrompt(segments: PromptSegment[], opts: ExecutionOptions): OpenAITextMessage[] {
        const messages = formatOpenAILikePrompt(segments);
        //Add JSON instruction is schema is provided
        if (opts.result_schema) {
            messages.push({
                role: "user",
                content: "IMPORTANT: " + getJSONSafetyNotice(opts.result_schema)
            });
        }
        return messages;
    }

    async requestCompletion(messages: OpenAITextMessage[], options: ExecutionOptions): Promise<Completion<any>> {


        const res = await this.client.chat.completions.create({
            model: options.model,
            messages: messages,
            max_tokens: options.max_tokens,
            temperature: options.temperature,
            response_format: this.getResponseFormat(options),
        });


        const choice = res.choices[0];
        const result = choice.message.content;

        return {
            result: result,
            token_usage: {
                prompt: res.usage?.prompt_tokens,
                result: res.usage?.completion_tokens,
                total: res.usage?.total_tokens,
            },
            finish_reason: choice.finish_reason,
            original_response: options.include_original_response ? res : undefined,
        };
    }

    async requestCompletionStream(messages: OpenAITextMessage[], options: ExecutionOptions): Promise<AsyncIterable<string>> {

        const res = await this.client.chat.completions.create({
            model: options.model,
            messages: messages,
            max_tokens: options.max_tokens,
            temperature: options.temperature,
            response_format: this.getResponseFormat(options),
            stream: true
        });

        return transformAsyncIterator(res, (res) => res.choices[0].delta.content || '');

    }

    async listModels(): Promise<AIModel<string>[]> {
        const models = await this.client.models.list();

        if (!models.data) {
            throw new Error("No models found");
        }

        const aimodels = models.data?.map(m => {
            if (!m.id) {
                throw new Error("Model id is missing");
            }
            return {
                id: m.id,
                name: m.id,
                description: undefined,
                provider: this.provider,
                owner: m.owned_by || '',
            }
        });

        return aimodels;
    }

    validateConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async generateEmbeddings({ }: EmbeddingsOptions): Promise<EmbeddingsResult> {
        throw new Error("Method not implemented.");
    }

}