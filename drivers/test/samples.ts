import { PromptRole, PromptSegment } from "@llumiverse/core"
import { JSONSchema4 } from "json-schema"



export const testPrompt_color: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: "What color is the sky?"
    }
]

//json schema with 2 properties object and color
export const testSchema_color: JSONSchema4 = {
    type: "object",
    properties: {
        color: {
            type: "string"
        }
    }
}