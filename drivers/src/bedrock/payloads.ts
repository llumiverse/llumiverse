import { ClaudeMessagesPrompt } from "@llumiverse/core/formatters";

//Overall documentation:
//https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-meta.html
export interface LLama3RequestPayload {
    prompt: string;
    temperature?: number;
    top_p?: number;
    max_gen_len?: number;
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
export interface ClaudeRequestPayload extends ClaudeMessagesPrompt {
    anthropic_version: "bedrock-2023-05-31";
    max_tokens: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    stop_sequences?: [string];
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-jurassic2.html
export interface AI21JurassicRequestPayload {
    prompt: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    stopSequences?: [string]
    presencePenalty?: {
        scale : number
    }
    frequencyPenalty?: {
        scale : number
    }
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command.html
export interface CohereRequestPayload {
    prompt: string;
    temperature: number;
    max_tokens?: number;
    p?: number;
    k?: number;
    stop_sequences: [string],
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-text.html
export interface AmazonRequestPayload {
    inputText: string;
    textGenerationConfig?: {
        temperature?: number;
        topP?: number;
        maxTokenCount?: number;
        stopSequences?: [string];
    };
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-mistral-text-completion.html
export interface MistralPayload {
    prompt: string;
    temperature: number;
    max_tokens: number;
    top_p?: number;
    top_k?: number;
    stop?: [string]
}

//Docs at: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-cohere-command-r-plus.html
export interface CohereCommandRPayload {

    message: string,
    chat_history?: {
        role: 'USER' | 'CHATBOT',
        message: string }[],
    documents?: { title: string, snippet: string }[],
    search_queries_only?: boolean,
    preamble?: string,
    max_tokens: number,
    temperature?: number,
    p?: number,
    k?: number,
    prompt_truncation?: string,
    frequency_penalty?: number,
    presence_penalty?: number,
    seed?: number,
    return_prompt?: boolean,
    stop_sequences?: string[],
    raw_prompting?: boolean

}