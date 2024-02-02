import { AIModel, ModelType, PromptOptions, PromptSegment } from "@llumiverse/core";
import { VertexAIDriver } from "../index.js";
import { getPromptAsText } from "../utils/prompts.js";
import { AbstractPalmModelDefinition, NonStreamingPromptBase, PalmResponseMetadata, StreamingPromptBase } from "./palm-model-base.js";

export type Palm2TextPrompt = NonStreamingPromptBase<{
    prompt: string
}>


export type Palm2TextStreamingPrompt = StreamingPromptBase<{
    prompt: {
        stringVal: string
    }
}>


interface Palm2TextResponsePrediction {
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

export interface Palm2TextResponse {
    predictions: Palm2TextResponsePrediction[],
    metadata: PalmResponseMetadata
}

export class Palm2TextDefinition extends AbstractPalmModelDefinition<Palm2TextPrompt, Palm2TextStreamingPrompt> {
    versions: string[] = [];
    model: AIModel = {
        id: "text-bison",
        name: "PaLM 2 for Text",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
        canStream: true,
    }

    createNonStreamingPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): Palm2TextPrompt {
        return {
            instances: [{
                prompt: getPromptAsText(segments, opts)
            }],
            parameters: {
                // put defauilts here
            }
        } as Palm2TextPrompt;
    }

    extractContentFromResponse(response: Palm2TextResponse): string {
        return response.predictions[0].content ?? '';
    }

    extractContentFromResponseChunk(chunk: any): string {
        return chunk.outputs[0]?.structVal.content.stringVal || '';
    }

}
