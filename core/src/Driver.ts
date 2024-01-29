/**
 * Classes to handle the execution of an interaction in an execution environment.
 * Base abstract class is then implemented by each environment
 * (eg: OpenAI, HuggingFace, etc.)
 */

import { DefaultCompletionStream, FallbackCompletionStream } from "./CompletionStream.js";
import { PromptFormatters } from "./formatters.js";
import {
    AIModel,
    Completion,
    CompletionStream,
    DataSource,
    DriverOptions,
    ExecutionOptions,
    ExecutionResponse,
    Logger,
    ModelSearchPayload,
    PromptFormats,
    PromptOptions,
    PromptSegment,
    TrainingJob,
    TrainingOptions,
    TrainingPromptOptions
} from "./types.js";
import { validateResult } from "./validation.js";


const ConsoleLogger: Logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
}

const noop = () => void 0;
const NoopLogger: Logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
}

export function createLogger(logger: Logger | false | undefined) {
    return logger ? logger : logger === false ? NoopLogger : ConsoleLogger;
}


export interface Driver<PromptT = unknown> {

    /**
     * 
     * @param segments 
     * @param completion 
     * @param model the model to train
     */
    createTrainingPrompt(options: TrainingPromptOptions): string;

    createPrompt(segments: PromptSegment[], opts: PromptOptions): PromptT;

    execute(segments: PromptSegment[], options: ExecutionOptions): Promise<ExecutionResponse<PromptT>>;

    // by default no stream is supported. we block and we return all at once
    //stream(segments: PromptSegment[], options: ExecutionOptions): Promise<StreamingExecutionResponse<PromptT>>;
    stream(segments: PromptSegment[], options: ExecutionOptions): Promise<CompletionStream<PromptT>>;

    startTraining(dataset: DataSource, options: TrainingOptions): Promise<TrainingJob>;

    cancelTraining(jobId: string): Promise<TrainingJob>;

    getTrainingJob(jobId: string): Promise<TrainingJob>;

    //list models available for this environement
    listModels(params: ModelSearchPayload): Promise<AIModel[]>;

    //list models that can be trained
    listTrainableModels(): Promise<AIModel[]>;

    //check that it is possible to connect to the environment
    validateConnection(): Promise<boolean>;

    //generate embeddings for a given text
    generateEmbeddings(content: string, model?: string): Promise<{ embeddings: number[], model: string; }>;

}

/**
 * To be implemented by each driver
 */
export abstract class AbstractDriver<OptionsT extends DriverOptions = DriverOptions, PromptT = unknown> implements Driver<PromptT> {
    options: OptionsT;
    logger: Logger;

    abstract provider: string; // the provider name
    abstract defaultFormat: PromptFormats;

    constructor(opts: OptionsT) {
        this.options = opts;
        this.logger = createLogger(opts.logger);
    }

    createTrainingPrompt(options: TrainingPromptOptions): string {
        const prompt = this.createPrompt(options.segments, { resultSchema: options.schema })
        return JSON.stringify({
            prompt,
            completion: typeof options.completion === 'string' ? options.completion : JSON.stringify(options.completion)
        });
    }

    startTraining(_dataset: DataSource, _options: TrainingOptions): Promise<TrainingJob> {
        throw new Error("Method not implemented.");
    }

    cancelTraining(_jobId: string): Promise<TrainingJob> {
        throw new Error("Method not implemented.");
    }

    getTrainingJob(_jobId: string): Promise<TrainingJob> {
        throw new Error("Method not implemented.");
    }

    validateResult(result: Completion, options: ExecutionOptions) {
        if (!result.error && options.resultSchema) {
            try {
                result.result = validateResult(result.result, options.resultSchema);
            } catch (error: any) {
                this.logger?.error({ err: error, data: result.result }, `[${this.provider}] [${options.model}] ${error.code ? '[' + error.code + '] ' : ''}Result validation error: ${error.message}`);
                result.error = {
                    code: error.code || error.name,
                    message: error.message,
                    data: result.result,
                }
            }
        }
    }

    async execute(segments: PromptSegment[], options: ExecutionOptions): Promise<ExecutionResponse<PromptT>> {
        const prompt = this.createPrompt(segments, options);
        return this._execute(prompt, options);
    }

    async _execute(prompt: PromptT, options: ExecutionOptions): Promise<ExecutionResponse<PromptT>> {
        this.logger.debug(
            `[${this.provider}] Executing ${options.model} with prompt`, prompt,
        );
        try {
            const start = Date.now();
            const result = await this.requestCompletion(prompt, options);
            this.validateResult(result, options);
            const execution_time = Date.now() - start;
            return { ...result, prompt, execution_time };
        } catch (error) {
            (error as any).prompt = prompt;
            throw error;
        }
    }

    // by default no stream is supported. we block and we return all at once
    async stream(segments: PromptSegment[], options: ExecutionOptions): Promise<CompletionStream<PromptT>> {
        const canStream = await this.canStream(options);
        if (canStream) {
            return new DefaultCompletionStream(this, segments, options);
        } else {
            return new FallbackCompletionStream(this, segments, options);
        }
    }

    public createPrompt(segments: PromptSegment[], opts: PromptOptions): PromptT {
        return PromptFormatters[opts.format || this.defaultFormat](
            segments,
            opts.resultSchema
        );
    }

    /**
     * Must be overrided if the implementation cannot stream.
     * Some implementation may be able to stream for certain models but not for others. 
     * You must overwrite and return false if the current model doesn't support streaming.
     * The default implementation returns true, so it is assumed that the streaming can be done.
     * If this method returns false then the streaming execution will fallback on a blocking execution streaming the entire response as a single event.
     * @param options the execution options containing the target model name.
     * @returns true if the exeuction can be streamed false otherwise.
     */
    protected canStream(_options: ExecutionOptions) {
        return Promise.resolve(true);
    }

    abstract requestCompletion(prompt: PromptT, options: ExecutionOptions): Promise<Completion>;

    abstract requestCompletionStream(prompt: PromptT, options: ExecutionOptions): Promise<AsyncIterable<string>>;

    //list models available for this environement
    abstract listModels(params: ModelSearchPayload): Promise<AIModel[]>;

    abstract listTrainableModels(): Promise<AIModel[]>;

    //check that it is possible to connect to the environment
    abstract validateConnection(): Promise<boolean>;

    //generate embeddings for a given text
    abstract generateEmbeddings(content: string, model?: string): Promise<{ embeddings: number[], model: string; }>;

}

