import { JSONSchema4 } from "json-schema";
import { PromptFormatter } from "./formatters/index.js";
import { JSONObject } from "./json.js";

export interface EmbeddingsOptions {
    /**
     * The content to generate the embeddings for. Required.
     */
    content: string;
    /**
     * The model to use to generate the embeddings. Optional.
     */
    model?: string;
    /**
     * Additional options for the embeddings generation. Optional.
     * The supported properties depends on the target implementation.
     */
    [key: string]: any;
}

export interface EmbeddingsResult {
    /**
     * The embedding vectors corresponding to the words in the input text.
     */
    values: number[];
    /**
     * The model used to hgenerate the embeddings.
     */
    model?: string;
    /**
     * Number of tokens of the input text.
     */
    token_count?: number;
    /**
     * Additional properties. Depends on the target implementation.
     */
    [key: string]: any;
}

export interface ResultValidationError {
    code: 'validation_error' | 'json_error';
    message: string;
    data?: string;
}

export interface Completion<ResultT = any> {
    // the driver impl must return the result and optionally the token_usage. the execution time is computed by the extended abstract driver
    result: ResultT;
    token_usage?: ExecutionTokenUsage;

    /**
     * The finish reason as reported by the model: stop | length or other model specific values
     */
    finish_reason?: "stop" | "length" | string;

    /**
     * Set only if a result validation error occured, otherwise if the result is valid the error field is undefined
     * This can only be set if the result_schema is set and the reuslt could not be parsed as a json or if the result does not match the schema
     */
    error?: ResultValidationError;

    /**
     * The original response. Only included if the option include_original_response is set to true and the request is made using execute. Not supported when streaming.
     */
    original_response?: Record<string, any>;

}

export interface ExecutionResponse<PromptT = any> extends Completion {
    prompt: PromptT;
    /**
     * The time it took to execute the request in seconds
     */
    execution_time?: number;
}


export interface CompletionStream<PromptT = any> extends AsyncIterable<string> {
    completion: ExecutionResponse<PromptT> | undefined;
}

export interface Logger {
    debug: (...obj: any[]) => void;
    info: (...obj: any[]) => void;
    warn: (...obj: any[]) => void;
    error: (...obj: any[]) => void;
}

export interface DriverOptions {
    logger?: Logger | "console";
}

export interface PromptOptions {
    model: string;
    /**
     * A custom formatter to use for format the final model prompt from the input prompt segments.
     * If no one is specified the driver will choose a formatter compatible with the target model
     */
    format?: PromptFormatter;
    result_schema?: JSONSchema4;
}
export interface ExecutionOptions extends PromptOptions {
    temperature?: number;
    max_tokens?: number;
    stop_sequence?: string | string[];

    /**
     * restricts the selection of tokens to the “k” most likely options, based on their probabilities
     * Lower values make the model more deterministic, more focused. Examples:
     * - 10 - result will be highly controlled anc contextually relevant
     * - 50 - result will be more creative but maintaining a balance between control and creativity
     * - 100 - will lead to more creative and less predictable outputs
     * It will be ignored on OpenAI since it does not support it
     */
    top_k?: number;

    /**
     * An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
     * Either use temperature or top_p, not both
     */
    top_p?: number;

    /**
     * Only supported for OpenAI. Look at OpenAI documentation for more detailsx
     */
    top_logprobs?: number;

    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
     * Ignored for models which doesn;t support it
     */
    presence_penalty?: number;

    /**
     * Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
     * Ignored for models which doesn;t support it
     */
    frequency_penalty?: number;

    /**
     * If set to true the original response from the target LLM will be included in the response under the original_response field.
     * This is useful for debugging and for some advanced use cases.
     * It is ignored on streaming requests
     */
    include_original_response?: boolean;
}

// ============== Prompts ===============
export enum PromptRole {
    safety = "safety",
    system = "system",
    user = "user",
    assistant = "assistant",
}

export interface PromptSegment {
    role: PromptRole;
    content: string;
    files?: FileAttachment[]
}

export interface FileAttachment {
    url: string;
    type: 'image' | 'video' | 'file' | 'data'
    mime_type?: string
}

export interface ExecutionTokenUsage {
    prompt?: number;
    result?: number;
    total?: number;
}


// ============== AI MODEL ==============

export interface AIModel<ProviderKeys = string> {
    id: string; //id of the model known by the provider
    name: string; //human readable name
    provider: ProviderKeys; //provider name
    description?: string;
    version?: string; //if any version is specified
    type?: ModelType; //type of the model
    tags?: string[]; //tags for searching
    owner?: string; //owner of the model
    status?: AIModelStatus; //status of the model
    can_stream?: boolean; //if the model's reponse can be streamed
    is_custom?: boolean; //if the model is a custom model (a trained model)
    is_multimodal?: boolean //if the model support files and images
}

export enum AIModelStatus {
    Available = "available",
    Pending = "pending",
    Stopped = "stopped",
    Unavailable = "unavailable",
    Unknown = "unknown"
}

/**
 * payload to list available models for an enviroment
 * @param environmentId id of the environment
 * @param query text to search for in model name/description
 * @param type type of the model
 * @param tags tags for searching
 */
export interface ModelSearchPayload {
    text: string;
    type?: ModelType;
    tags?: string[];
    owner?: string;
}


export enum ModelType {
    Classifier = "classifier",
    Regressor = "regressor",
    Clustering = "clustering",
    AnomalyDetection = "anomaly-detection",
    TimeSeries = "time-series",
    Text = "text",
    Image = "image",
    Audio = "audio",
    Video = "video",
    Embedding = "embedding",
    Chat = "chat",
    Code = "code",
    NLP = "nlp",
    MultiModal = "multi-modal",
    Test = "test",
    Other = "other",
    Unknown = "unknown"
}


// ============== training =====================



export interface DataSource {
    name: string;
    getStream(): ReadableStream<Uint8Array | string>;
    getURL(): Promise<string>;
}

export interface TrainingOptions {
    name: string; // the new model name
    model: string; // the model to train
    params?: JSONObject; // the training parameters
}

export interface TrainingPromptOptions {
    segments: PromptSegment[];
    completion: string | JSONObject;
    model: string; // the model to train
    schema?: JSONSchema4; // the resuilt schema f any
}

export enum TrainingJobStatus {
    running = "running",
    succeeded = "succeeded",
    failed = "failed",
    cancelled = "cancelled",
}

export interface TrainingJob {
    id: string; // id of the training job
    status: TrainingJobStatus; // status of the training job - depends on the implementation
    details?: string;
    model?: string; // the name of the fine tuned model which is created
}
