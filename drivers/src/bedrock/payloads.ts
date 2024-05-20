import { ClaudeMessagesPrompt } from "@llumiverse/core/formatters";

export interface LLama2RequestPayload {
    prompt: string;
    temperature: number;
    top_p?: number;
    max_gen_len: number;
}
export interface ClaudeRequestPayload extends ClaudeMessagesPrompt {
    anthropic_version: "bedrock-2023-05-31";
    max_tokens: number;
    prompt: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    stop_sequences?: [string];
}
export interface AI21RequestPayload {
    prompt: string;
    temperature: number;
    maxTokens: number;
}
export interface CohereRequestPayload {
    prompt: string;
    temperature: number;
    max_tokens?: number;
    p?: number;
}
export interface AmazonRequestPayload {
    inputText: string;
    textGenerationConfig: {
        temperature: number;
        topP: number;
        maxTokenCount: number;
        stopSequences: [string];
    };
}
export interface MistralPayload {
    prompt: string;
    temperature: number;
    max_tokens: number;
    top_p?: number;
    top_k?: number;
}

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