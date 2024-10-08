import { Bedrock, CreateModelCustomizationJobCommand, FoundationModelSummary, GetModelCustomizationJobCommand, GetModelCustomizationJobCommandOutput, ModelCustomizationJobStatus, StopModelCustomizationJobCommand } from "@aws-sdk/client-bedrock";
import { BedrockRuntime, InvokeModelCommandOutput, ResponseStream } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";
import { AIModel, AbstractDriver, Completion, DataSource, DriverOptions, EmbeddingsOptions, EmbeddingsResult, ExecutionOptions, PromptOptions, PromptSegment, TrainingJob, TrainingJobStatus, TrainingOptions } from "@llumiverse/core";
import { transformAsyncIterator } from "@llumiverse/core/async";
import { ClaudeMessagesPrompt, formatClaudePrompt } from "@llumiverse/core/formatters";
import { AwsCredentialIdentity, Provider } from "@smithy/types";
import mnemonist from "mnemonist";
import { AI21RequestPayload, AmazonRequestPayload, ClaudeRequestPayload, CohereCommandRPayload, CohereRequestPayload, LLama2RequestPayload, MistralPayload } from "./payloads.js";
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

export type BedrockPrompt = string | ClaudeMessagesPrompt;

export class BedrockDriver extends AbstractDriver<BedrockDriverOptions, BedrockPrompt> {

    static PROVIDER = "bedrock";

    provider = BedrockDriver.PROVIDER;

    private _executor?: BedrockRuntime;
    private _service?: Bedrock;

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

    protected async formatPrompt(segments: PromptSegment[], opts: PromptOptions): Promise<BedrockPrompt> {
        //TODO move the anthropic test in abstract driver?
        if (opts.model.includes('anthropic')) {
            //TODO: need to type better the types aren't checked properly by TS
            return await formatClaudePrompt(segments, opts.result_schema);
        } else {
            return await super.formatPrompt(segments, opts) as string;
        }
    }

    extractDataFromResponse(prompt: BedrockPrompt, response: InvokeModelCommandOutput): Completion {

        const decoder = new TextDecoder();
        const body = decoder.decode(response.body);
        const result = JSON.parse(body);

        const getTextAnsStopReason = (): string[] => {
            if (result.generation) {
                // LLAMA2
                return [result.generation, result.stop_reason]; // comes in coirrect format (stop, length)
            } else if (result.generations) {
                // Cohere
                return [result.generations[0].text, cohereFinishReason(result.generations[0].finish_reason)];
            } else if (result.chat_history) {
                //Cohere Command R
                return [result.text, cohereFinishReason(result.finish_reason)];
            } else if (result.completions) {
                //A21
                return [result.completions[0].data?.text, a21FinishReason(result.completions[0].finishReason?.reason)];
            } else if (result.content) {
                // Claude
                //if last prompt.messages is {, add { to the response
                const p = prompt as ClaudeMessagesPrompt;
                const lastMessage = (p as ClaudeMessagesPrompt).messages[p.messages.length - 1];
                const res = lastMessage.content[0].text === '{' ? '{' + result.content[0]?.text : result.content[0]?.text;

                return [res, claudeFinishReason(result.stop_reason)];

            } else if (result.outputs) {
                // mistral
                return [result.outputs[0]?.text, result.outputs[0]?.stop_reason]; // the stop reason is in the expected format ("stop" and "length")
            } else if (result.results) {
                // Amazon Titan
                return [result.results[0]?.outputText ?? '', titanFinishReason(result.results[0]?.completionReason)];
            } else if (result.completion) { // TODO: who uses this?
                return [result.completion];
            } else {
                return [result.toString()];
            }
        };

        const [text, finish_reason] = getTextAnsStopReason();

        const promptLength = typeof prompt === 'string' ? prompt.length :
            (prompt.system || '').length + prompt.messages.reduce((acc, m) => acc + m.content.length, 0);
        return {
            result: text,
            token_usage: {
                result: text?.length,
                prompt: promptLength,
                total: text?.length + promptLength,
            },
            finish_reason
        }
    }

    async requestCompletion(prompt: BedrockPrompt, options: ExecutionOptions): Promise<Completion> {

        const payload = this.preparePayload(prompt, options);
        const executor = this.getExecutor();
        const res = await executor.invokeModel({
            modelId: options.model,
            contentType: "application/json",
            body: JSON.stringify(payload),
        });
        const completion = this.extractDataFromResponse(prompt, res);
        if (options.include_original_response) {
            completion.original_response = res;
        }
        return completion;
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

    async requestCompletionStream(prompt: BedrockPrompt, options: ExecutionOptions): Promise<AsyncIterable<string>> {
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

            const addBracket = () => {
                if (typeof prompt === 'object' && (prompt as ClaudeMessagesPrompt).messages) {
                    const p = prompt as ClaudeMessagesPrompt;
                    const lastMessage = p.messages[p.messages.length - 1];
                    return lastMessage.content[0].text === '{';
                }
                return false;
            };

            return transformAsyncIterator(res.body, (stream: ResponseStream) => {
                const segment = JSON.parse(decoder.decode(stream.chunk?.bytes));
                //console.log("Debug Segment for model " + options.model, JSON.stringify(segment));
                if (segment.delta) { // who is this?
                    return segment.delta.text || '';
                } else if (segment.completion) { // who is this?
                    return segment.completion;
                } else if (segment.text) { //cohere
                    return segment.text;
                } else if (segment.completions) {
                    return segment.completions[0].data?.text;
                } else if (segment.generation) {
                    return segment.generation;
                } else if (segment.generations) {
                    return segment.generations[0].text;
                } else if (segment.outputs) {
                    // mistral.mixtral-8x7b-instruct-v0:1
                    return segment.outputs[0].text;
                    //segment.outputs[0].stop_reason;
                } else if (segment.outputText) {
                    // Amazon Titan
                    return segment.outputText;
                    //completionReason
                    // token count too
                } else {
                    segment.toString();
                }

            },
                () => addBracket() ? '{' : ''
            );

        }).catch((err) => {
            this.logger.error("[Bedrock] Failed to stream", err);
            throw err;
        });
    }



    preparePayload(prompt: BedrockPrompt, options: ExecutionOptions) {

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
        } else if (contains(options.model, "claude")) {

            const maxToken = () => {
                if (options.max_tokens) {
                    return options.max_tokens;
                
                } else if (contains(options.model, "claude-3-5")) {
                    return 8192;
                } else {
                    return 4096
                }
            }
            return {
                anthropic_version: "bedrock-2023-05-31",
                ...(prompt as ClaudeMessagesPrompt),
                temperature: options.temperature,
                max_tokens: maxToken(),
            } as ClaudeRequestPayload;
        } else if (contains(options.model, "ai21")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                maxTokens: options.max_tokens,
            } as AI21RequestPayload;
        } else if (contains(options.model, "command-r-plus")) {
            return {
                message: prompt as string,
                max_tokens: options.max_tokens,
                temperature: options.temperature,
            } as CohereCommandRPayload;

        }
        else if (contains(options.model, "cohere")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                max_tokens: options.max_tokens,
            } as CohereRequestPayload;
        } else if (contains(options.model, "amazon")) {
            return {
                inputText: "User: " + (prompt as string) + "\nBot:", // see https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html#model-parameters-titan-request-response
                textGenerationConfig: {
                    temperature: options.temperature,
                    topP: options.top_p,
                    maxTokenCount: options.max_tokens,
                    //stopSequences: ["\n"],
                },
            } as AmazonRequestPayload;
        } else if (contains(options.model, "mistral")) {
            return {
                prompt: prompt,
                temperature: options.temperature,
                max_tokens: options.max_tokens,
            } as MistralPayload;
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
        const stream = await dataset.getStream();
        const upload = await forceUploadFile(s3, stream, this.options.training_bucket, dataset.name);

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

    async listModels(): Promise<AIModel[]> {
        this.logger.debug("[Bedrock] listing models");
        // exclude trainable models since they are not executable
        const filter = (m: FoundationModelSummary) => m.inferenceTypesSupported?.includes("ON_DEMAND") ?? false;
        return this._listModels(filter);
    }

    async _listModels(foundationFilter?: (m: FoundationModelSummary) => boolean): Promise<AIModel[]> {
        const service = this.getService();
        const [foundationals, customs] = await Promise.all([
            service.listFoundationModels({}).catch(() => {
                this.logger.warn("[Bedrock] Can't list foundation models. Check if the user has the right permissions.");
                return undefined
            }),
            service.listCustomModels({}).catch(() => {
                this.logger.warn("[Bedrock] Can't list custom models. Check if the user has the right permissions.");
                return undefined
            }),
        ]);

        if (!foundationals?.modelSummaries) {
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
                //description: ``,
                owner: m.providerName,
                can_stream: m.responseStreamingSupported ?? false,
                is_multimodal: m.inputModalities?.includes("IMAGE") ?? false,
                tags: m.outputModalities ?? [],
            };

            return model;
        });

        //add custom models
        if (customs?.modelSummaries) {
            customs.modelSummaries.forEach((m) => {

                if (!m.modelArn) {
                    throw new Error("Model ID not found");
                }

                const model: AIModel = {
                    id: m.modelArn,
                    name: m.modelName ?? m.modelArn,
                    provider: this.provider,
                    description: `Custom model from ${m.baseModelName}`,
                    is_custom: true,
                };

                aimodels.push(model);
                this.validateConnection;
            });
        }

        return aimodels;
    }

    async generateEmbeddings({ text, image, model }: EmbeddingsOptions): Promise<EmbeddingsResult> {

        this.logger.info("[Bedrock] Generating embeddings with model " + model);
        const defaultModel = image ? "amazon.titan-embed-image-v1" : "amazon.titan-embed-text-v2:0" 

        const invokeBody = {
            inputText: text,
            inputImage: image
        }

        const executor = this.getExecutor();
        const res = await executor.invokeModel(
            {
                modelId: model ?? defaultModel,
                contentType: "application/json",
                body: JSON.stringify(invokeBody),
            }
        );

        const decoder = new TextDecoder();
        const body = decoder.decode(res.body);

        const result = JSON.parse(body);

        if (!result.embedding) {
            throw new Error("Embeddings not found");
        }

        return {
            values: result.embedding,
            model: defaultModel,
            token_count: result.inputTextTokenCount
        };

    }

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


function claudeFinishReason(reason: string | undefined) {
    if (!reason) return undefined;
    switch (reason) {
        case 'end_turn': return "stop";
        case 'max_tokens': return "length";
        default: return reason; //stop_sequence
    }
}

function cohereFinishReason(reason: string | undefined) {
    if (!reason) return undefined;
    switch (reason) {
        case 'COMPLETE': return "stop";
        case 'MAX_TOKENS': return "length";
        default: return reason;
    }
}

function a21FinishReason(reason: string | undefined) {
    if (!reason) return undefined;
    switch (reason) {
        case 'endoftext': return "stop";
        case 'length': return "length";
        default: return reason;
    }
}

function titanFinishReason(reason: string | undefined) {
    if (!reason) return undefined;
    switch (reason) {
        case 'FINISH': return "stop";
        case 'LENGTH': return "length";
        default: return reason;
    }
}
