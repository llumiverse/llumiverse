import { v1 } from "@google-cloud/aiplatform";
import { GenerateContentRequest, VertexAI } from "@google-cloud/vertexai";
import { AIModel, AbstractDriver, BuiltinProviders, Completion, DriverOptions, ExecutionOptions, ModelSearchPayload, PromptFormats, PromptOptions, PromptSegment } from "@llumiverse/core";
import { asyncMap } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";
import { BuiltinModels } from "./models.js";
import { formatPrompt, getGenerativeModel } from "./prompt.js";
//import { GoogleAuth } from "google-auth-library";

export interface VertexAIDriverOptions extends DriverOptions {
    project: string;
    region: string;
}

export class VertexAIDriver extends AbstractDriver<VertexAIDriverOptions, GenerateContentRequest> {
    provider = BuiltinProviders.vertexai;
    defaultFormat = PromptFormats.genericTextLLM;

    aiplatform: v1.ModelServiceClient;
    vertexai: VertexAI;
    authToken: Promise<string>;
    fetchClient: FetchClient;

    constructor(
        options: VertexAIDriverOptions
    ) {
        super(options);
        //this.aiplatform = new v1.ModelServiceClient();
        this.vertexai = new VertexAI({
            project: this.options.project,
            location: this.options.region,
        });
        this.authToken = this.vertexai.preview.token;
        this.fetchClient = createFetchClient({
            region: this.options.region,
            project: this.options.project,
        }).withAuthCallback(async () => {
            const token = await this.vertexai.preview.token;
            return `Bearer ${token}`;
        });
        this.aiplatform = new v1.ModelServiceClient({
            projectId: this.options.project,
            apiEndpoint: `${this.options.region}-${API_BASE_PATH}`,
        });
    }

    public createPrompt(segments: PromptSegment[], opts: PromptOptions): GenerateContentRequest {
        return formatPrompt(segments, opts.resultSchema);
    }

    async requestCompletion(prompt: GenerateContentRequest, options: ExecutionOptions): Promise<Completion<any>> {
        const model = getGenerativeModel(this.vertexai, options);
        const r = await model.generateContent(prompt);
        const response = await r.response;
        console.log('aggregated response: ', JSON.stringify(response)), '======', response;
        throw new Error('not implemented');
        // return {
        //     result: resp.response,
        //     token_usage: {
        //         prompt: resp.usage?.prompt_tokens,
        //         result: resp.usage?.completion_tokens,
        //         total: resp.usage?.total_tokens,
        //     },
        // };    
    }
    async requestCompletionStream(prompt: GenerateContentRequest, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const model = getGenerativeModel(this.vertexai, options);
        const streamingResp = await model.generateContentStream(prompt);

        const stream = asyncMap(streamingResp.stream, async (item) => {
            if (item.candidates.length > 0) {
                for (const candidate of item.candidates) {
                    if (candidate.content?.role === 'model') {
                        const parts = candidate.content?.parts;
                        if (parts) {
                            for (const part of parts) {
                                if (part.text) {
                                    return part.text;
                                }
                            }
                        }
                    }
                }
            }
            return '';
        });

        return stream;
    }

    async listModels(_params: ModelSearchPayload): Promise<AIModel<string>[]> {
        return BuiltinModels;
        // try {
        //     const response = await this.fetchClient.get('/publishers/google/models/gemini-pro');
        //     console.log('>>>>>>>>', response);
        // } catch (err: any) {
        //     console.error('+++++VETREX ERROR++++++', err);
        //     throw err;
        // }

        // TODO uncomment this to use apiplatform instead of the fetch client
        // const response = await this.aiplatform.listModels({
        //     parent: `projects/${this.options.project}/locations/${this.options.region}`,
        // });

        return []; //TODO
    }
    listTrainableModels(): Promise<AIModel<string>[]> {
        throw new Error("Method not implemented.");
    }
    validateConnection(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    generateEmbeddings(_content: string, _model?: string | undefined): Promise<{ embeddings: number[]; model: string; }> {
        throw new Error("Method not implemented.");
    }

}

//'us-central1-aiplatform.googleapis.com',
const API_BASE_PATH = 'aiplatform.googleapis.com';
function createFetchClient({ region, project, apiEndpoint, apiVersion = 'v1' }: {
    region: string;
    project: string;
    apiEndpoint?: string;
    apiVersion?: string;
}) {
    const vertexBaseEndpoint = apiEndpoint ?? `${region}-${API_BASE_PATH}`;
    return new FetchClient(`https://${vertexBaseEndpoint}/${apiVersion}/projects/${project}/locations/${region}`).withHeaders({
        'Content-Type': 'application/json',
    });
}
