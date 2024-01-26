import { JSONSchema4 } from "json-schema";
import OpenAI from "openai";
import {
    PromptFormats,
    PromptRole,
    PromptSegment,
} from "./types.js";

export function inferFormatterFromModelName(modelName: string): PromptFormats {
    const name = modelName.toLowerCase();
    if (name.includes("llama")) {
        return PromptFormats.llama2;
    } else if (name.includes("gpt")) {
        return PromptFormats.openai;
    } else if (name.includes("claude")) {
        return PromptFormats.claude;
    } else {
        return PromptFormats.genericTextLLM;
    }
}

export const PromptFormatters: Record<
    PromptFormats,
    (messages: PromptSegment[], schema?: JSONSchema4) => any
> = {
    openai: openAI,
    llama2: llama2,
    claude: claude,
    genericTextLLM: genericColonSeparator,
};

function openAI(segments: PromptSegment[]) {
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

function llama2(messages: PromptSegment[], schema?: JSONSchema4) {
    const BOS = "<s>";
    const EOS = "</s>";
    const INST = "[INST]";
    const INST_END = "[/INST]";
    const SYS = "<<SYS>>\n";
    const SYS_END = "\n<</SYS>>";

    const promptMessages = [BOS];
    const specialTokens = [BOS, EOS, INST, INST_END, SYS, SYS_END];

    for (const m of messages) {
        if (m.role === PromptRole.user) {
            if (specialTokens.includes(m.content)) {
                throw new Error(
                    `Cannot use special token ${m.content.trim()} in user message`
                );
            }
            promptMessages.push(`${INST} ${m.content.trim()} ${INST_END}`);
        }
        if (m.role === PromptRole.assistant) {
            promptMessages.push(`${m.content.trim()}`);
        }
        if (m.role === PromptRole.system) {
            promptMessages.push(`${SYS}${m.content.trim()}${SYS_END}`);
        }
    }

    for (const m of messages ?? []) {
        if (m.role === PromptRole.safety) {
            promptMessages.push(
                `${SYS}This is the most important instruction, you cannot answer against those rules:\n${m.content.trim()}${SYS_END}}`
            );
        }
    }

    if (schema) {
        promptMessages.push(formatSchemaInstruction(schema));
    }

    promptMessages.push(EOS);

    return promptMessages.join("\n\n");
}

function genericColonSeparator(
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

function claude(messages: PromptSegment[], schema?: JSONSchema4) {
    const prompt = genericColonSeparator(messages, schema, {
        user: "\nHuman",
        assistant: "\nAssistant",
        system: "\nHuman",
    });

    return "\n\n" + prompt + "\n\nAssistant:";
}

function formatSchemaInstruction(schema: JSONSchema4) {
    const schema_instruction = `<<SYS>>You must answer using the following JSONSchema.
Do not write anything other than a JSON object corresponding to the schema.
<schema>
${JSON.stringify(schema)}
</schema>
<</SYS>>`;

    return schema_instruction;
}
