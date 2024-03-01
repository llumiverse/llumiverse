import { AIModel, AbstractDriver, Completion, DriverOptions, ExecutionOptions, PromptFormats, PromptSegment } from "@llumiverse/core";
import { transformSSEStream } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";
import { CompletionRequestParams, ListModelsResponse, ResponseFormat } from "./types.js";

//TODO retry on 429
//const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

const ENDPOINT = 'https://api.mistral.ai';

interface MistralAIDriverOptions extends DriverOptions {
    apiKey: string;
    endpointUrl: string;
}

export class MistralAIDriver extends AbstractDriver<MistralAIDriverOptions, LLMMessage[]> {
    provider: string;
    apiKey: string;
    defaultFormat: PromptFormats;
    //client: MistralClient;
    client: FetchClient;
    endpointUrl?: string;

    constructor(options: MistralAIDriverOptions) {
        super(options);
        this.provider = "MistralAI";
        this.defaultFormat = PromptFormats.genericTextLLM;
        this.apiKey = options.apiKey;
        //this.client = new MistralClient(options.apiKey, options.endpointUrl);
        this.client = new FetchClient(options.endpointUrl || ENDPOINT).withHeaders({
            authorization: `Bearer ${this.apiKey}`
        });
    }

    getResponseFormat = (_options: ExecutionOptions): ResponseFormat | undefined => {


        /*const responseFormatJson: ResponseFormat = {
            type: "json_object",
        } as ResponseFormat

        const responseFormatText: ResponseFormat = {
            type: "text",
        } as ResponseFormat;
        */

        //return _options.resultSchema ? responseFormatJson : responseFormatText;

        //TODO remove this when Mistral properly supports the parameters - it makes an error for now
        return undefined
    }

    createPrompt(segments: PromptSegment[], opts: ExecutionOptions): LLMMessage[] {
        // use same format as OpenAI as that's what MistralAI uses
        const prompts = super.createPrompt(segments, { ...opts, format: PromptFormats.openai })

        //Add JSON instruction is schema is provided
        if (opts.resultSchema) {
            const content = "The user is explicitely instructing that the result should be a JSON object.\nThe schema is as follows: \n" + JSON.stringify(opts.resultSchema);
            prompts.push({
                role: "user",
                content: content
            });
        }

        return prompts;

    }

    async requestCompletion(messages: LLMMessage[], options: ExecutionOptions): Promise<Completion<any>> {

        const res = await this.client.post('/v1/chat/completions', {
            payload: _makeChatCompletionRequest({
                model: options.model,
                messages: messages,
                maxTokens: options.max_tokens ?? 1024,
                temperature: options.temperature ?? 0.7,
                responseFormat: this.getResponseFormat(options),
            })
        })

        const result = res.choices[0]?.message.content;

        return {
            result: result,
            token_usage: {
                prompt: res.usage.prompt_tokens,
                result: res.usage.completion_tokens,
                total: res.usage.total_tokens,
            }
        };
    }

    async requestCompletionStream(messages: LLMMessage[], options: ExecutionOptions): Promise<AsyncIterable<string>> {

        const stream = await this.client.post('/v1/chat/completions', {
            payload: _makeChatCompletionRequest({
                model: options.model,
                messages: messages,
                maxTokens: options.max_tokens ?? 1024,
                temperature: options.temperature ?? 0.7,
                responseFormat: this.getResponseFormat(options),
                stream: true
            }),
            reader: 'sse'
        });

        return transformSSEStream(stream, (data: string) => {
            const json = JSON.parse(data);
            return json.choices[0]?.delta.content ?? '';
        });

    }

    async listModels(): Promise<AIModel<string>[]> {
        const models: ListModelsResponse = await this.client.get('v1/models');

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


/**
 * Creates a chat completion request
 * @param {*} model
 * @param {*} messages
 * @param {*} tools
 * @param {*} temperature
 * @param {*} maxTokens
 * @param {*} topP
 * @param {*} randomSeed
 * @param {*} stream
 * @param {*} safeMode deprecated use safePrompt instead
 * @param {*} safePrompt
 * @param {*} toolChoice
 * @param {*} responseFormat
 * @return {Promise<Object>}
 */
function _makeChatCompletionRequest({
    model,
    messages,
    tools,
    temperature,
    maxTokens,
    topP,
    randomSeed,
    stream,
    safeMode,
    safePrompt,
    toolChoice,
    responseFormat,
}: CompletionRequestParams) {
    return {
        model: model,
        messages: messages,
        tools: tools ?? undefined,
        temperature: temperature ?? undefined,
        max_tokens: maxTokens ?? undefined,
        top_p: topP ?? undefined,
        random_seed: randomSeed ?? undefined,
        stream: stream ?? undefined,
        safe_prompt: (safeMode || safePrompt) ?? undefined,
        tool_choice: toolChoice ?? undefined,
        response_format: responseFormat ?? undefined,
    };
};
