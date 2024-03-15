import { PromptRole } from "../index.js";
import { PromptSegment } from "../types.js";

export interface OpenAITextMessage {
    content: string;
    role: "system" | "user" | "assistant";
}
/**
 * OpenAI text only prompts
 * @param segments 
 * @returns 
 */
export function formatOpenAILikePrompt(segments: PromptSegment[]) {
    const system: OpenAITextMessage[] = [];
    const others: OpenAITextMessage[] = [];
    const safety: OpenAITextMessage[] = [];

    for (const msg of segments) {
        if (msg.role === PromptRole.system) {
            system.push({ content: msg.content, role: "system" });
        } else if (msg.role === PromptRole.safety) {
            safety.push({ content: "IMPORTANT: " + msg.content, role: "system" });
        } else {
            others.push({ content: msg.content, role: "user" });
        }
    }

    // put system mesages first and safety last
    return system.concat(others).concat(safety);
}
