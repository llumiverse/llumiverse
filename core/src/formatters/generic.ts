import { JSONSchema4 } from "json-schema";
import { PromptRole, PromptSegment } from "../index.js";

export function genericColonSeparator(
    messages: PromptSegment[],
    schema?: JSONSchema4,
    labels: {
        user: string;
        assistant: string;
        system: string;
    } = { user: "User", assistant: "Assistant", system: "System" }
) {
    const promptMessages = [];
    for (const m of messages) {
        if (m.role === PromptRole.user) {
            promptMessages.push(`${labels?.user}: ${m.content.trim()}`);
        }
        if (m.role === PromptRole.assistant) {
            promptMessages.push(`${labels.assistant}: ${m.content.trim()}`);
        }
        if (m.role === PromptRole.system) {
            promptMessages.push(`${labels.system}: ${m.content.trim()}`);
        }
    }

    if (schema) {
        promptMessages.push(`${labels.system}: You must answer using the following JSONSchema:
        ---
        ${JSON.stringify(schema)}
        ---`);
    }

    return promptMessages.join("\n\n");
}
