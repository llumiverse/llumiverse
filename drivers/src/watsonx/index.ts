import { AIModel, AbstractDriver, Completion, DriverOptions, EmbeddingsResult, ExecutionOptions } from "@llumiverse/core";
import { transformSSEStream } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";
import { WatsonAuthToken, WatsonxListModelResponse, WatsonxModelSpec, WatsonxTextGenerationPayload, WatsonxTextGenerationResponse } from "./interfaces";

interface WatsonxDriverOptions extends DriverOptions {
    apiKey: string;
    projectId: string;
    endpointUrl: string;
}

const API_VERSION = "2024-03-14"

export class WatsonxDriver extends AbstractDriver<WatsonxDriverOptions, string> {
    static PROVIDER = "watsonx";
    provider = WatsonxDriver.PROVIDER;
    apiKey: string;
    endpoint_url: string;
    projectId: string;
    authToken?: WatsonAuthToken;
    fetcher?: FetchClient;

    constructor(options: WatsonxDriverOptions) {
        super(options);
        this.apiKey = options.apiKey;
        this.projectId = options.projectId;
        this.endpoint_url = options.endpointUrl;

    }

    async fetchClient() {
        if (this.fetcher) {
            return this.fetcher;
        }

        const authToken = await this.getAuthToken();
        this.fetcher = new FetchClient(this.endpoint_url).withHeaders({
            authorization: `Bearer ${authToken}`,
        })

        return this.fetcher;
    }

    async requestCompletion(prompt: string, options: ExecutionOptions): Promise<Completion<any>> {
        const payload: WatsonxTextGenerationPayload = {
            model_id: options.model,
            input: prompt,
            parameters: {
                max_new_tokens: options.max_tokens,
                //time_limit: options.time_limit,
            },
            project_id: this.projectId,
        }
        const fetcher = await this.fetchClient();
        const res = await fetcher.post(`/ml/v1/text/generation?version=${API_VERSION}`, { payload }) as WatsonxTextGenerationResponse;

        const result = res.results[0];

        return {
            result: result.generated_text,
            token_usage: {
                prompt: result.input_token_count,
                result: result.generated_token_count,
                total: result.input_token_count + result.generated_token_count,
            },
            finish_reason: result.stop_reason,
            original_response: options.include_original_response ? res : undefined,
        }
    }

    async requestCompletionStream(prompt: string, options: ExecutionOptions): Promise<AsyncIterable<string>> {

        const payload: WatsonxTextGenerationPayload = {
            model_id: options.model,
            input: prompt,
            parameters: {
                max_new_tokens: options.max_tokens,
                //time_limit: options.time_limit,
            },
            project_id: this.projectId,
        }

        const fetcher = await this.fetchClient();
        const stream = await fetcher.post(`/ml/v1/text/generation_stream?version=${API_VERSION}`, {
            payload: payload,
            reader: 'sse'
        })

        return transformSSEStream(stream, (data: string) => {
            const json = JSON.parse(data) as WatsonxTextGenerationResponse;
            return json.results[0]?.generated_text ?? '';
        });

    }

    async listModels(): Promise<AIModel<string>[]> {
        const fetcher = await this.fetchClient();
        const res = await fetcher.get(`/ml/v1/foundation_model_specs?version=${API_VERSION}`) as WatsonxListModelResponse;
        const models = res.resources;

        const aimodels = models.map((m: WatsonxModelSpec) => {
            return {
                id: m.model_id,
                name: m.label,
                description: m.short_description,
                provider: m.source,
            }
        });

        return aimodels;

    }

    async getAuthToken(): Promise<string> {
 

        if (this.authToken) {
            const now = Date.now() / 1000;
            if (now < this.authToken.expiration) {
                return this.authToken.access_token;
            } else {
                this.logger.debug("Token expired, refetching", this.authToken, now)
            }
        }

        this.logger.debug("Fetching Auth Token")
        const authToken = await fetch('https://iam.cloud.ibm.com/identity/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${this.apiKey}`,
        }).then(response => response.json()) as WatsonAuthToken;

        this.authToken = authToken;

        return this.authToken.access_token;

    }

    validateConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    generateEmbeddings(): Promise<EmbeddingsResult> {
        throw new Error("Method not implemented.");
    }

}