import { PromptRole, PromptSegment } from "../index.js";

export interface ClaudeMessage {
    role: 'user' | 'assistant',
    content: {
        type: "image" | "text",
        source?: string, // only set for images
        text?: string // only set for text messages
    }[]
}

export interface ClaudeMessagesPrompt {
    system?: string;
    messages: ClaudeMessage[]
}

/**
 * A formatter user by Bedrock to format prompts for claude related models
 */

export function claudeMessages(segments: PromptSegment[]): ClaudeMessagesPrompt {
    const system: string[] = [];
    const safety: string[] = [];
    const messages: ClaudeMessage[] = [];

    for (const msg of segments) {
        if (msg.role === PromptRole.system) {
            system.push(msg.content);
        } else if (msg.role === PromptRole.safety) {
            safety.push(msg.content);
        } else {
            messages.push({ content: [{ type: "text", text: msg.content }], role: msg.role });
        }
    }

    // messages must contains at least 1 item. If the prompt doesn;t contains a user message (but only system messages)
    // we need to put the system messages in the messages array

    let systemMessage = system.join('\n').trim();
    if (messages.length === 0) {
        if (!systemMessage) {
            throw new Error('Prompt must contain at least one message');
        }
        messages.push({ content: [{ type: "text", text: systemMessage }], role: 'assistant' });
        systemMessage = safety.join('\n');
    } else if (safety.length > 0) {
        systemMessage = systemMessage + '\n\nIMPORTANT: ' + safety.join('\n');
    }

    // put system mesages first and safety last
    return {
        system: systemMessage,
        messages
    }
}

// export function claude(messages: PromptSegment[], schema?: JSONSchema4) {
//     const prompt = genericColonSeparator(messages, schema, {
//         user: "\nHuman",
//         assistant: "\nAssistant",
//         system: "\nHuman",
//     });

//     return "\n\n" + prompt + "\n\nAssistant:";
// }
