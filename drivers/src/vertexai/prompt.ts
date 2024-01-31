// import { Content, GenerateContentRequest, TextPart } from "@google-cloud/vertexai";
// import { PromptRole, PromptSegment } from "@llumiverse/core";
// import { JSONSchema4 } from "json-schema";

// export function formatPrompt(segments: PromptSegment[], schema?: JSONSchema4): GenerateContentRequest {
//     const others: Content[] = [];
//     const safety: Content[] = [];

//     for (const msg of segments) {
//         if (msg.role === PromptRole.safety) {
//             safety.push({
//                 role: "user",
//                 parts: [{ text: msg.content } as TextPart],
//             });
//         } else {
//             others.push({
//                 role: msg.role === PromptRole.assistant ? "model" : "user",
//                 parts: [{ text: msg.content } as TextPart],
//             });
//         }
//     }

//     if (schema) {
//         others.push({
//             role: "user",
//             parts: [{
//                 text: "You must answer using the following JSONSchema:\n" + JSON.stringify(schema)
//             } as TextPart],
//         })
//     }

//     // put system mesages first and safety last
//     return { contents: others.concat(safety) };
// }
