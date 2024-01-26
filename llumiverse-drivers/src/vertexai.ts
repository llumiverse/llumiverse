import { v1 } from "@google-cloud/aiplatform";
import { VertexAI } from "@google-cloud/vertexai";
import { AIModel, AbstractDriver, BuiltinProviders, Completion, DriverOptions, ExecutionOptions, ModelSearchPayload, PromptFormats } from "@llumiverse/core";
import { FetchClient } from "api-fetch-client";
//import { GoogleAuth } from "google-auth-library";

export interface VertexAIDriverOptions extends DriverOptions {
    project: string;
    region: string;
}

export class VertexAIDriver extends AbstractDriver<VertexAIDriverOptions, string> {
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

    requestCompletion(_prompt: string, _options: ExecutionOptions): Promise<Completion<any>> {
        throw new Error("Method not implemented.");
    }
    requestCompletionStream(_prompt: string, _options: ExecutionOptions): Promise<AsyncIterable<string>> {
        throw new Error("Method not implemented.");
    }
    async listModels(_params: ModelSearchPayload): Promise<AIModel<string>[]> {
        const response = await this.fetchClient.get('/models');
        // TODO uncomment this to use apiplatform instead of the fetch client
        // const response = await this.aiplatform.listModels({
        //     parent: `projects/${this.options.project}/locations/${this.options.region}`,
        // });
        console.log('>>>>>>>>', response);
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
