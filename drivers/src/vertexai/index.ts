import { v1 } from "@google-cloud/aiplatform";
import { GenerateContentRequest, VertexAI } from "@google-cloud/vertexai";
import { AIModel, AbstractDriver, BuiltinProviders, Completion, DriverOptions, ExecutionOptions, ModelSearchPayload, PromptFormats, PromptOptions, PromptSegment } from "@llumiverse/core";
import { FetchClient } from "api-fetch-client";
import { BuiltinModels, getModelDefinition } from "./models.js";
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

    // protected canStream(_options: ExecutionOptions): Promise<boolean> {
    //     return Promise.resolve(false);
    // }

    public createPrompt(segments: PromptSegment[], options: PromptOptions): GenerateContentRequest {
        return getModelDefinition(options.model).createPrompt(this, segments, options);
    }

    async requestCompletion(prompt: GenerateContentRequest, options: ExecutionOptions): Promise<Completion<any>> {
        return getModelDefinition(options.model).requestCompletion(this, prompt, options);
    }
    async requestCompletionStream(prompt: GenerateContentRequest, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        return getModelDefinition(options.model).requestCompletionStream(this, prompt, options);
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

// class MyClient extends FetchClient {
//     handleRequest(fetch: FETCH_FN, url: string, init: RequestInit): Promise<Response> {
//         console.log('########', url);
//         return super.handleRequest(fetch, url, init);
//     }
// }