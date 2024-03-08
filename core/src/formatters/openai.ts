import { PromptRole } from "../index.js";
import { PromptSegment } from "../types.js";
import OpenAI from "openai";

export function openAI(segments: PromptSegment[]) {
    const system: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    const others: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    const safety: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const msg of segments) {
        if (msg.role === PromptRole.system) {
            system.push({ content: msg.content, role: "system" });
        } else if (msg.role === PromptRole.safety) {
            safety.push({ content: msg.content, role: "system" });
        } else {
            others.push({ content: msg.content, role: "user" });
        }
    }

    // put system mesages first and safety last
    return system.concat(others).concat(safety);
}
