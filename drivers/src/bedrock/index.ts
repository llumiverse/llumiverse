import { Bedrock, CreateModelCustomizationJobCommand, FoundationModelSummary, GetModelCustomizationJobCommand, GetModelCustomizationJobCommandOutput, ModelCustomizationJobStatus, StopModelCustomizationJobCommand } from "@aws-sdk/client-bedrock";
import { BedrockRuntime, InvokeModelCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";
import { AIModel, AbstractDriver, BuiltinProviders, Completion, DataSource, DriverOptions, ExecutionOptions, ModelSearchPayload, PromptFormats, TrainingJob, TrainingJobStatus, TrainingOptions } from "@llumiverse/core";
import { transformAsyncIterator } from "@llumiverse/core/async";
import { AwsCredentialIdentity, Provider } from "@smithy/types";
import mnemonist from "mnemonist";
import { forceUploadFile } from "./s3.js";

const { LRUCache } = mnemonist;

const supportStreamingCache = new LRUCache<string, boolean>(4096);

export interface BedrockModelCapabilities {
    name: string;
    canStream: boolean;
}

export interface BedrockDriverOptions extends DriverOptions {
    /**
     * The AWS region
     */
    region: string;
    /**
     * Tthe bucket name to be used for training. 
     * It will be created oif nto already exixts
     */
    training_bucket?: string;

    /**
     * The role ARN to be used for training
     */
    training_role_arn?: string;

    /**
     * The credentials to use to access AWS
     */
    credentials?: AwsCredentialIdentity | Provider<AwsCredentialIdentity>;
}

export class BedrockDriver extends AbstractDriver<BedrockDriverOptions, string> {

    provider = BuiltinProviders.bedrock;

    private _executor?: BedrockRuntime;
    private _service?: Bedrock;

    defaultFormat = PromptFormats.genericTextLLM;

    constructor(options: BedrockDriverOptions) {
        super(options);
        if (!options.region) {
            throw new Error("No region found. Set the region in the environment's endpoint URL.");
        }
    }

    getExecutor() {
        if (!this._executor) {
            this._executor = new BedrockRuntime({
                region: this.options.region,
                credentials: this.options.credentials,
            });
        }
        return this._executor;
    }

    getService() {
        if (!this._service) {
            this._service = new Bedrock({
                region: this.options.region,
                credentials: this.options.credentials,
            });
        }
        return this._service;
    }

    extractDataFromResponse(prompt: string, response: InvokeModelCommandOutput): Completion {

        const decoder = new TextDecoder();
        const body = decoder.decode(response.body);
        const result = JSON.parse(body);

        const getText = () => {
            if (result.completion) {
                return result.completion;
            } else if (result.generation) {
                return result.generation;
            } else if (result.generations) {
                return result.generations[0].text;
            } else if (result.completions) {
                //A21
                return result.completions[0].data?.text;
            } else {
                result.toString();
            }
        };

        const text = getText();

        return {
            result: text,
            token_usage: {
                result: text?.length,
                prompt: prompt.length,
                total: text?.length + prompt.length,
            }
        }
    }

    async requestCompletion(prompt: string, options: ExecutionOptions): Promise<Completion> {

        const payload = this.preparePayload(prompt, options);
        const executor = this.getExecutor();
        const res = await executor.invokeModel({
            modelId: options.model,
            contentType: "application/json",
            body: JSON.stringify(payload),
        });

        return this.extractDataFromResponse(prompt, res);
    }

    protected async canStream(options: ExecutionOptions): Promise<boolean> {
        let canStream = supportStreamingCache.get(options.model);
        if (canStream == null) {
            const response = await this.getService().getFoundationModel({
                modelIdentifier: options.model
            });
            canStream = response.modelDetails?.responseStreamingSupported ?? false;
            supportStreamingCache.set(options.model, canStream);
        }
        return canStream;
    }

    async requestCompletionStream(prompt: string, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        const payload = this.preparePayload(prompt, options);
        const executor = this.getExecutor();
        return executor.invokeModelWithResponseStream({
            modelId: options.model,
            contentType: "application/json",
            body: JSON.stringify(payload),
        }).then((res) => {

            if (!res.body) {
                throw new Error("Body not found");
            }
            const decoder = new TextDecoder();

            return transformAsyncIterator(res.body, (stream) => {
                const segment = JSON.parse(decoder.decode(stream.chunk?.bytes));
                if (segment.completion) {
                    return segment.completion;
                } else if (segment.completions) {
                    return segment.completions[0].data?.text;
                } else if (segment.generation) {
                    return segment.generation;
                } else if (segment.generations) {
                    return segment.generations[0].text;
                } else {
                    segment.toString();
                }

            });

        }).catch((err) => {
            this.logger.error("[Bedrock] Failed to stream", err);
            throw err;
        });
    }



    preparePayload(prompt: string, options: ExecutionOptions) {

        //split arn on / should give provider
        //TODO: check if works with custom models
        //const provider = options.model.split("/")[0];
        const contains = (str: string, substr: string) => str.indexOf(substr) !== -1;

        if (contains(options.model, "meta")) {
            return {
                prompt,
                temperature: options.temperature,
                max_gen_len: options.max_tokens,
            } as LLama2RequestPayload
        } else if (contains(options.model, "anthropic")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                max_tokens_to_sample: options.max_tokens ?? 256,
            } as ClaudeRequestPayload;
        } else if (contains(options.model, "ai21")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                maxTokens: options.max_tokens,
            } as AI21RequestPayload;
        } else if (contains(options.model, "cohere")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                max_tokens: options.max_tokens,
                p: 0.9,
            } as CohereRequestPayload;
        } else if (contains(options.model, "amazon")) {
            return {
                inputText: prompt,
                textGenerationConfig: {
                    temperature: options.temperature,
                    topP: 0.9,
                    maxTokenCount: options.max_tokens,
                    stopSequences: ["\n"],
                },
            } as AmazonRequestPayload;
        } else {
            throw new Error("Cannot prepare payload for unknown provider: " + options.model);
        }

    }

    async startTraining(dataset: DataSource, options: TrainingOptions): Promise<TrainingJob> {

        //convert options.params to Record<string, string>
        const params: Record<string, string> = {};
        for (const [key, value] of Object.entries(options.params || {})) {
            params[key] = String(value);
        }

        if (!this.options.training_bucket) {
            throw new Error("Training cannot nbe used since the 'training_bucket' property was not specified in driver options")
        }

        const s3 = new S3Client({ region: this.options.region, credentials: this.options.credentials });
        const upload = await forceUploadFile(s3, dataset.getStream(), this.options.training_bucket, dataset.name);

        const service = this.getService();
        const response = await service.send(new CreateModelCustomizationJobCommand({
            jobName: options.name + "-job",
            customModelName: options.name,
            roleArn: this.options.training_role_arn || undefined,
            baseModelIdentifier: options.model,
            clientRequestToken: "llumiverse-" + Date.now(),
            trainingDataConfig: {
                s3Uri: `s3://${upload.Bucket}/${upload.Key}`,
            },
            outputDataConfig: undefined,
            hyperParameters: params,
            //TODO not supported?
            //customizationType: "FINE_TUNING",
        }));

        const job = await service.send(new GetModelCustomizationJobCommand({
            jobIdentifier: response.jobArn
        }));

        return jobInfo(job, response.jobArn!);
    }

    async cancelTraining(jobId: string): Promise<TrainingJob> {
        const service = this.getService();
        await service.send(new StopModelCustomizationJobCommand({
            jobIdentifier: jobId
        }));
        const job = await service.send(new GetModelCustomizationJobCommand({
            jobIdentifier: jobId
        }));

        return jobInfo(job, jobId);
    }

    async getTrainingJob(jobId: string): Promise<TrainingJob> {
        const service = this.getService();
        const job = await service.send(new GetModelCustomizationJobCommand({
            jobIdentifier: jobId
        }));

        return jobInfo(job, jobId);
    }

    // ===================== management API ==================

    async validateConnection(): Promise<boolean> {
        const service = this.getService();
        this.logger.debug("[Bedrock] validating connection", service.config.credentials.name);
        //return true as if the client has been initialized, it means the connection is valid
        return true;
    }


    async listTrainableModels(): Promise<AIModel<string>[]> {
        this.logger.debug("[Bedrock] listing trainable models");
        return this._listModels(m => m.customizationsSupported ? m.customizationsSupported.includes("FINE_TUNING") : false);
    }

    async listModels(_params: ModelSearchPayload): Promise<AIModel[]> {
        this.logger.debug("[Bedrock] listing models");
        // exclude trainable models since they are not executable
        const filter = (m: FoundationModelSummary) => m.inferenceTypesSupported?.includes("ON_DEMAND") ?? false;
        return this._listModels(filter);
    }

    async _listModels(foundationFilter?: (m: FoundationModelSummary) => boolean): Promise<AIModel[]> {
        const service = this.getService();
        const [foundationals, customs] = await Promise.all([
            service.listFoundationModels({}),
            service.listCustomModels({}),
        ]);

        if (!foundationals.modelSummaries) {
            throw new Error("Foundation models not found");
        }

        let fmodels = foundationals.modelSummaries || [];
        if (foundationFilter) {
            fmodels = fmodels.filter(foundationFilter);
        }

        const aimodels: AIModel[] = fmodels.map((m) => {

            if (!m.modelId) {
                throw new Error("modelId not found");
            }

            const model: AIModel = {
                id: m.modelArn ?? m.modelId,
                name: `${m.providerName} ${m.modelName}`,
                provider: this.provider,
                description: `id: ${m.modelId}`,
                owner: m.providerName,
                canStream: m.responseStreamingSupported ?? false,
                tags: m.outputModalities ?? [],
            };

            return model;
        });

        //add custom models
        if (customs.modelSummaries) {
            customs.modelSummaries.forEach((m) => {

                if (!m.modelArn) {
                    throw new Error("Model ID not found");
                }

                const model: AIModel = {
                    id: m.modelArn,
                    name: m.modelName ?? m.modelArn,
                    provider: this.provider,
                    description: `Custom model from ${m.baseModelName}`,
                    isCustom: true,
                };

                aimodels.push(model);
                this.validateConnection;
            });
        }

        return aimodels;
    }

    async generateEmbeddings(content: string, model: string = "amazon.titan-embed-text-v1"): Promise<{ embeddings: number[], model: string; }> {

        this.logger.info("[Bedrock] Generating embeddings with model " + model);

        const executor = this.getExecutor();
        const res = await executor.invokeModel(
            {
                modelId: model,
                contentType: "text/plain",
                body: content,
            }
        );

        const decoder = new TextDecoder();
        const body = decoder.decode(res.body);

        const result = JSON.parse(body);

        if (!result.embedding) {
            throw new Error("Embeddings not found");
        }

        return result.embedding;

    }

}



interface LLama2RequestPayload {
    prompt: string;
    temperature: number;
    top_p?: number;
    max_gen_len: number;
}

interface ClaudeRequestPayload {
    prompt: string;
    temperature?: number;
    max_tokens_to_sample?: number;
    top_p?: number,
    top_k?: number,
    stop_sequences?: [string];
}

interface AI21RequestPayload {
    prompt: string;
    temperature: number;
    maxTokens: number;
}

interface CohereRequestPayload {
    prompt: string;
    temperature: number;
    max_tokens?: number;
    p?: number;
}

interface AmazonRequestPayload {
    inputText: string,
    textGenerationConfig: {
        temperature: number,
        topP: number,
        maxTokenCount: number,
        stopSequences: [string];
    };
}


function jobInfo(job: GetModelCustomizationJobCommandOutput, jobId: string): TrainingJob {
    const jobStatus = job.status;
    let status = TrainingJobStatus.running;
    let details: string | undefined;
    if (jobStatus === ModelCustomizationJobStatus.COMPLETED) {
        status = TrainingJobStatus.succeeded;
    } else if (jobStatus === ModelCustomizationJobStatus.FAILED) {
        status = TrainingJobStatus.failed;
        details = job.failureMessage || "error";
    } else if (jobStatus === ModelCustomizationJobStatus.STOPPED) {
        status = TrainingJobStatus.cancelled;
    } else {
        status = TrainingJobStatus.running;
        details = jobStatus;
    }
    job.baseModelArn
    return {
        id: jobId,
        model: job.outputModelArn,
        status,
        details
    }
}



