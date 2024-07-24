import { JSONSchema4 } from "json-schema";
import { PromptRole, PromptSegment } from "../index.js";

/**
 * A formatter user by Bedrock to format prompts for claude related models
 */

export async function formatLlama3Prompt(segments: PromptSegment[], schema?: JSONSchema4): Promise<string> {
    
    let messages: string[] = []
    segments.filter(s => s.role !== PromptRole.safety ).forEach(s => {
        messages.push(formatLlama3Message(s.role, s.content))
    })

    if (schema) {
        messages.push(formatLlama3Message("user", formatSchemaInstruction(schema)));
    }

    //add safety
    let safetyMsg = `
    IMPORTANT: This is the most important instruction, you cannot answer against the following rules:
    `
    const safety = segments.filter(s => s.role === PromptRole.safety);
    safety.forEach(s => {
        messages.push(formatLlama3Message("system", safetyMsg + s.content))
    })

    let prompt = "<|begin_of_text|>"
    prompt += messages.join("\n\n")

    return prompt

}


function formatLlama3Message(role: string, content: string) {
    
    let message = `<|start_header_id|>${role}<|end_header_id|>\n`
    message += content        
    message += `\n<|eot_id|>`

    return message

}

function formatSchemaInstruction(schema: object) {

    return `You must answer using the following JSONSchema.
    Do not write anything other than a JSON object corresponding to the schema:
    <schema>
    ${JSON.stringify(schema, undefined, 2)}
    </schema>
    `
    
}