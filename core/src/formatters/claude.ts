import { JSONSchema4 } from "json-schema";
import { PromptRole, PromptSegment } from "../index.js";
import { readStreamAsBase64 } from "../stream.js";
import { getJSONSafetyNotice } from "./commons.js";

export interface ClaudeMessage {
    role: 'user' | 'assistant',
    content: ClaudeMessagePart[]
}

interface ClaudeMessagePart {
    type: "image" | "text",
    source?: {
        type: "base64",
        media_type: string,
        data: string,
    }, // only set for images
    text?: string // only set for text messages
}

export interface ClaudeMessagesPrompt {
    system?: string;
    messages: ClaudeMessage[]
}

/**
 * A formatter user by Bedrock to format prompts for claude related models
 */

export async function formatClaudePrompt(segments: PromptSegment[], schema?: JSONSchema4): Promise<ClaudeMessagesPrompt> {
    const system: string[] = [];
    const safety: string[] = [];
    const messages: ClaudeMessage[] = [];

    //TODO type: 'image' -> detect from f.mime_type
    for (const segment of segments) {

        const parts: ClaudeMessagePart[] = [];
        if (segment.files) for (const f of segment.files) {
            const source = await f.getStream();
            const data = await readStreamAsBase64(source);
            parts.push({
                type: 'image',
                source: {
                    type: "base64",
                    media_type: f.mime_type || 'image/png',
                    data
                }
            })
        }

        if (segment.content) {
            parts.push({
                type: "text",
                text: segment.content
            })
        }

        if (segment.role === PromptRole.system) {
            system.push(segment.content);
        } else if (segment.role === PromptRole.safety) {
            safety.push(segment.content);
        } else if (messages.length > 0 && messages[messages.length - 1].role === segment.role) {
            //concatenate messages of the same role (Claude requires alternative user and assistant roles)
            messages[messages.length - 1].content.push(...parts);
        } else {
            messages.push({
                role: segment.role,
                content: parts
            });
        }


    }

    if (schema) {
        safety.push("IMPORTANT: " + getJSONSafetyNotice(schema));
    }

    // messages must contains at least 1 item. If the prompt doesn;t contains a user message (but only system messages)
    // we need to put the system messages in the messages array

    let systemMessage = system.join('\n').trim();
    if (messages.length === 0) {
        if (!systemMessage) {
            throw new Error('Prompt must contain at least one message');
        }
        messages.push({ content: [{ type: "text", text: systemMessage }], role: 'user' });
        systemMessage = safety.join('\n');
    } else if (safety.length > 0) {
        systemMessage = systemMessage + '\n\nIMPORTANT: ' + safety.join('\n');
    }


    /*if (schema) {
        messages.push({
            role: "user",
            content: [{
                type: "text",
                text: getJSONSafetyNotice(schema)
            }]
        });
    }*/

    /*start Claude's message to amke sure it answers properly in JSON
   if enabled, this requires to add the { to Claude's response*/
    if (schema) {
        messages.push({
            role: "assistant",
            content: [{
                type: "text",
                text: "{"
            }]
        });
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
