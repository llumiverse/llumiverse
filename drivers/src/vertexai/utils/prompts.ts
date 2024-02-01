import { PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";
import { JSONSchema4 } from "json-schema";

export interface PromptParamatersBase {
    temperature?: number,
    maxOutputTokens?: number,
    topK?: number,
    topP?: number,
    groundingConfig?: string,
    stopSequences?: string[],
    candidateCount?: number,
    logprobs?: number,
    presencePenalty?: number,
    frequencyPenalty?: number,
    logitBias?: Record<string, number>,
    seed?: number,
}

export function getJSONSafetyNotice(schema: JSONSchema4) {
    return "The answer must be a JSON object using the following JSON Schema:\n" + JSON.stringify(schema)
}

export function getPromptAsText(segments: PromptSegment[], options: PromptOptions): string {
    const isChat = segments.find(m => m.role === PromptRole.assistant);
    const context: string[] = [];
    const content: string[] = [];
    const safety: string[] = [];
    for (const segment of segments) {
        switch (segment.role) {
            case PromptRole.user:
                if (isChat) {
                    content.push('USER: ' + segment.content);
                } else {
                    content.push(segment.content);
                }
                break;
            case PromptRole.assistant:
                content.push('ASSISTANT: ' + segment.content);
                break;
            case PromptRole.system:
                context.push(segment.content);
                break;
            case PromptRole.safety:
                safety.push(segment.content);
                break;
        }
    }

    if (options.resultSchema) {
        safety.push(getJSONSafetyNotice(options.resultSchema));
    }

    const out = [];
    if (context.length > 0) {
        out.push('CONTEXT: ' + context.join('\n'));
    }
    if (content.length > 0) {
        const prefix = context.length > 0 && !isChat ? 'INSTRUCTION: ' : '';
        out.push(prefix + content.join('\n'));
    }
    if (safety.length > 0) {
        out.push('IMPORTANT: ' + safety.join('\n'));
    }
    return out.join('\n');
}
