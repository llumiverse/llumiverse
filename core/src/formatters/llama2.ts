import { JSONSchema4 } from "json-schema";
import { PromptRole, PromptSegment } from "../index.js";

export function formatLlama2Prompt(messages: PromptSegment[], schema?: JSONSchema4) {
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

function formatSchemaInstruction(schema: JSONSchema4) {
    const schema_instruction = `<<SYS>>You must answer using the following JSONSchema.
Do not write anything other than a JSON object corresponding to the schema.
<schema>
${JSON.stringify(schema)}
</schema>
<</SYS>>`;

    return schema_instruction;
}
