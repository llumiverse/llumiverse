import {
    HfInference,
    HfInferenceEndpoint,
    TextGenerationStreamOutput
} from "@huggingface/inference";
import {
    AIModel,
    AIModelStatus,
    AbstractDriver,
    BuiltinProviders,
    DriverOptions,
    ExecutionOptions,
    PromptFormats
} from "@llumiverse/core";
import { transformAsyncIterator } from "@llumiverse/core/async";
import { FetchClient } from "api-fetch-client";

export interface HuggingFaceIEDriverOptions extends DriverOptions {
    apiKey: string;
    endpoint_url: string;
}

export class HuggingFaceIEDriver extends AbstractDriver<HuggingFaceIEDriverOptions, string> {
    service: FetchClient;
    provider = BuiltinProviders.huggingface_ie;
    _executor?: HfInferenceEndpoint;
    defaultFormat = PromptFormats.genericTextLLM;

    constructor(
        options: HuggingFaceIEDriverOptions
    ) {
        super(options);
        if (!options.endpoint_url) {
            throw new Error(`Endpoint URL is required for ${this.provider}`);
        }
        this.service = new FetchClient(this.options.endpoint_url);
        this.service.headers["Authorization"] = `Bearer ${this.options.apiKey}`;
    }

    async getModelURLEndpoint(
        modelId: string
    ): Promise<{ url: string; status: string; }> {
        const res = (await this.service.get(`/${modelId}`)) as HuggingFaceIEModel;
        return {
            url: res.status.url,
            status: getStatus(res),
        };
    }

    async getExecutor(model: string) {
        if (!this._executor) {
            const endpoint = await this.getModelURLEndpoint(model);
            if (!endpoint.url)
                throw new Error(
                    `Endpoint URL not found for model ${model}`
                );
            if (endpoint.status !== AIModelStatus.Available)
                throw new Error(
                    `Endpoint ${model} is not running - current status: ${endpoint.status}`
                );

            this._executor = new HfInference(this.options.apiKey).endpoint(
                endpoint.url
            );
        }
        return this._executor;
    }

    async requestCompletionStream(prompt: string, options: ExecutionOptions) {
        const executor = await this.getExecutor(options.model);
        const req = executor.textGenerationStream({
            inputs: prompt,
            parameters: {
                temperature: options.temperature,
                max_new_tokens: options.max_tokens,
            },
        });

        return transformAsyncIterator(req, (val: TextGenerationStreamOutput) => {
            //special like <s> are not part of the result
            if (val.token.special) return "";
            return val.token.text;
        });
    }

    async requestCompletion(prompt: string, options: ExecutionOptions) {
        const executor = await this.getExecutor(options.model);
        const res = await executor.textGeneration({
            inputs: prompt,
            parameters: {
                temperature: options.temperature,
                max_new_tokens: options.max_tokens,
            },
        });

        return {
            result: res.generated_text,
            token_usage: {
                result: res.generated_text.length,
                prompt: prompt.length,
                total: res.generated_text.length + prompt.length,
            },
        };

    }

    // ============== management API ==============

    async listModels(): Promise<AIModel[]> {
        const res = await this.service.get("/");
        const hfModels = res.items as HuggingFaceIEModel[];
        if (!hfModels || !hfModels.length) return [];

        const models: AIModel[] = hfModels.map((model: HuggingFaceIEModel) => ({
            id: model.name,
            name: `${model.name} [${model.model.repository}:${model.model.task}]`,
            provider: this.provider,
            tags: [model.model.task],
            status: getStatus(model),
        }));

        return models;
    }

    async validateConnection(): Promise<boolean> {
        try {
            await this.service.get("/models");
            return true;
        } catch (error) {
            return false;
        }
    }

    async generateEmbeddings(content: string, model?: string): Promise<{ embeddings: number[], model: string; }> {
        this.logger?.debug(`[Huggingface] Generating embeddings for ${content} on ${model}`);
        throw new Error("Method not implemented.");
    }

}

//get status from HF status
function getStatus(hfModel: HuggingFaceIEModel): AIModelStatus {
    //[ pending, initializing, updating, updateFailed, running, paused, failed, scaledToZero ]
    switch (hfModel.status.state) {
        case "running":
            return AIModelStatus.Available;
        case "initializing":
            return AIModelStatus.Pending;
        case "updating":
            return AIModelStatus.Pending;
        case "updateFailed":
            return AIModelStatus.Unavailable;
        case "paused":
            return AIModelStatus.Stopped;
        case "failed":
            return AIModelStatus.Unavailable;
        case "scaledToZero":
            return AIModelStatus.Available;
        default:
            return AIModelStatus.Unknown;
    }
}

interface HuggingFaceIEModel {
    accountId: string;
    compute: {
        accelerator: string;
        instanceSize: string;
        instanceType: string;
        scaling: {
            maxReplica: number;
            minReplica: number;
        };
    };
    model: {
        framework: string;
        image: {
            huggingface: {};
        };
        repository: string;
        revision: string;
        task: string;
    };
    name: string;
    provider: {
        region: string;
        vendor: string;
    };
    status: {
        createdAt: string;
        createdBy: {
            id: string;
            name: string;
        };
        message: string;
        private: {
            serviceName: string;
        };
        readyReplica: number;
        state: string;
        targetReplica: number;
        updatedAt: string;
        updatedBy: {
            id: string;
            name: string;
        };
        url: string;
    };
    type: string;
}

/*
Example of model returned by the API
{
    "items": [
      {
        "accountId": "string",
        "compute": {
          "accelerator": "cpu",
          "instanceSize": "large",
          "instanceType": "c6i",
          "scaling": {
            "maxReplica": 8,
            "minReplica": 2
          }
        },
        "model": {
          "framework": "custom",
          "image": {
            "huggingface": {}
          },
          "repository": "gpt2",
          "revision": "6c0e6080953db56375760c0471a8c5f2929baf11",
          "task": "text-classification"
        },
        "name": "my-endpoint",
        "provider": {
          "region": "us-east-1",
          "vendor": "aws"
        },
        "status": {
          "createdAt": "2023-10-19T05:04:17.305Z",
          "createdBy": {
            "id": "string",
            "name": "string"
          },
          "message": "Endpoint is ready",
          "private": {
            "serviceName": "string"
          },
          "readyReplica": 2,
          "state": "pending",
          "targetReplica": 4,
          "updatedAt": "2023-10-19T05:04:17.305Z",
          "updatedBy": {
            "id": "string",
            "name": "string"
          },
          "url": "https://endpoint-id.region.vendor.endpoints.huggingface.cloud"
        },
        "type": "public"
      }
    ]
  }
*/
