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


export const testPrompt_describeImage: PromptSegment[] = [
    {
        content: "You are a lab assistant analysing images of animals, the tag the images with accurate description of the animal shown in the picture.",
        role: PromptRole.user,
        files: [{
            type: "image",
            mime_type: "image/jpeg",
            url: "https://lala.com"
        }]
    }
]

export const testSchema_animalDescription: JSONSchema4 =
    {
        type: "object",
        properties: {
            name: {
                type: "string"
            },
            type: {
                type: "string"
            },
            specy: {
                type: "string"
            },
            characteristics: {
                type: "array",
                items: {
                    type: "string"
                }
            }
        }
    }