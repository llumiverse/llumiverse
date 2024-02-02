import { AIModel, ModelType, PromptOptions, PromptSegment } from "@llumiverse/core";
import { VertexAIDriver } from "../index.js";
import { getPromptAsText } from "../utils/prompts.js";
import { AbstractPalmModelDefinition, NonStreamingPromptBase, PalmResponseMetadata, StreamingPromptBase } from "./palm-model-base.js";


export type CodeyTextPrompt = NonStreamingPromptBase<{
    prefix: string
}>


export type CodeyTextStreamingPrompt = StreamingPromptBase<{
    prefix: {
        stringVal: string
    }
}>

interface CodeyTextResponsePrediction {
    content: string,
    safetyAttributes: {
        scores: number[],
        safetyRatings: {
            severity: string,
            probabilityScore: number,
            severityScore: number,
            category: string
        }[]
    },
    citationMetadata: {
        citations: any[]
    }
}

export interface CodeyTextResponse {
    predictions: CodeyTextResponsePrediction[],
    metadata: PalmResponseMetadata
}

export class CodeyTextDefinition extends AbstractPalmModelDefinition<CodeyTextPrompt, CodeyTextStreamingPrompt> {
    versions: string[] = [];
    model: AIModel = {
        id: "code-bison",
        name: "Codey for Code Generation",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
        canStream: true,
    }

    createNonStreamingPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): CodeyTextPrompt {
        return {
            instances: [{
                prefix: getPromptAsText(segments, opts)
            }],
            parameters: {
                // put defauilts here
            }
        } as CodeyTextPrompt;
    }

    extractContentFromResponse(response: CodeyTextResponse): string {
        return response.predictions[0].content ?? '';
    }

    extractContentFromResponseChunk(chunk: any): string {
        return chunk.outputs[0]?.structVal.content.stringVal || '';
    }

}
