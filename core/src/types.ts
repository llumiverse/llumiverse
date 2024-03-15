import { JSONSchema4 } from "json-schema";
import { JSONObject } from "./json.js";
import { PromptFormatter } from "./formatters/index.js";

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
     * Set only if a result validation error occured, otherwise if the result is valid the error field is undefined
     * This can only be set if the resultSchema is set and the reuslt could not be parsed as a json or if the result does not match the schema
     */
    error?: ResultValidationError;
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
    resultSchema?: JSONSchema4;
}
export interface ExecutionOptions extends PromptOptions {
    temperature?: number;
    max_tokens?: number;
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
    canStream?: boolean; //if the model's reponse can be streamed
    isCustom?: boolean; //if the model is a custom model (a trained model)
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

// ============== Built-in formats and drivers =====================
//TODO

export enum BuiltinProviders {
    openai = 'openai',
    huggingface_ie = 'huggingface_ie',
    replicate = 'replicate',
    bedrock = 'bedrock',
    vertexai = 'vertexai',
    togetherai = 'togetherai',
    mistralai = 'mistralai',
    //virtual = 'virtual',    
    //cohere = 'cohere',
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
