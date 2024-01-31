import { Completion, ExecutionOptions, ModelType, PromptOptions, PromptSegment } from "@llumiverse/core";
import { VertexAIDriver } from "./index.js";
import { ModelDefinition } from "./models.js";
import { sse } from "./sse.js";
import { formatObjectAsTensor, getPromptAsText } from "./utils.js";

export interface Palm2TextPrompt {
    instances: { prompt: string }[];
    parameters: {
        temperature?: number,
        maxOutputTokens?: number,
        topK?: number,
        topP?: number,
        groundingConfig?: string,
        stopSequences?: string[],
        candidateCount?: number,
        logprobs?: number,
        presencePenalty?: number,
        frequencyPenalty?: number,
        logitBias?: Record<string, number>,
        echo?: boolean,
        seed?: number,
    }
}


interface Palm2TextResponseMetadata {
    tokenMetadata: {
        outputTokenCount: {
            totalBillableCharacters: number,
            totalTokens: number
        },
        inputTokenCount: {
            totalBillableCharacters: number,
            totalTokens: number
        }
    }
}

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
    metadata: Palm2TextResponseMetadata
}

export const Palm2TextDefinition: ModelDefinition<Palm2TextPrompt> = {
    model: {
        id: "text-bison",
        name: "PaLM 2 Text Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },

    createPrompt(_driver: VertexAIDriver, segments: PromptSegment[], opts: PromptOptions): Palm2TextPrompt {
        return {
            instances: [{
                prompt: getPromptAsText(segments, opts)
            }],
            parameters: {
                // put defauilts here
            }
        } as Palm2TextPrompt;
    },

    async requestCompletion(driver: VertexAIDriver, prompt: Palm2TextPrompt, options: ExecutionOptions): Promise<Completion> {
        Object.assign(prompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const response = await driver.fetchClient.post(`/publishers/google/models/${this.model.id}:predict`, {
            payload: prompt
        });

        const metadata = response.metadata as Palm2TextResponseMetadata;
        const inputTokens = metadata.tokenMetadata.inputTokenCount.totalTokens;
        const outputTokens = metadata.tokenMetadata.outputTokenCount.totalTokens;
        const result = response.predictions[0].content ?? '';
        return {
            result,
            token_usage: {
                prompt: inputTokens,
                result: outputTokens,
                total: inputTokens && outputTokens ? inputTokens + outputTokens : undefined,
            }
        } as Completion;
    },

    async requestCompletionStream(driver: VertexAIDriver, prompt: Palm2TextPrompt, options: ExecutionOptions): Promise<AsyncIterable<string>> {
        Object.assign(prompt.parameters, {
            temperature: options.temperature,
            maxOutputTokens: options.max_tokens,
        });

        const path = `/publishers/google/models/${this.model.id}:serverStreamingPredict?alt=sse`;

        const newPrompt = formatObjectAsTensor({
            inputs: prompt.instances,
            parameters: prompt.parameters
        });

        console.log('++++++PROMPT IS', newPrompt);

        const eventStrean = await driver.fetchClient.post(path, {
            payload: newPrompt,
            reader: sse
        });
        //return eventStrean.pipeThrough(transformStreamEvents);
        return eventStrean;
    }
}

// const transformStreamEvents = new TransformStream({
//     transform(event: ParsedEvent, controller: TransformStreamDefaultController) {
//         if (event.type === 'event' && event.data) {
//             const data = JSON.parse(event.data);
//             controller.enqueue(data.outputs[0]?.structVal.content.stringVal || '');
//         }
//     }
// })


// async function postSSE(client: FetchClient, path: string, payload: any) {
//     const auth = await client._auth!();
//     const url = client.getUrl(path);
//     console.log('>>>>>>>>>>>>>>>>> sse POST', url, payload, auth);
//     client.post(path, {
//         payload,
//         reader: sse
//     })

//     const response = await fetch(url, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": auth
//         },
//         body: JSON.stringify(payload),
//     });

//     if (response.status >= 400) {
//         const error = await response.text();
//         console.error('ERROR???', error)
//         throw new Error(`Error ${response.status}: ${error}`);
//     }
//     if (!response.body) {
//         throw new Error('No body in response');

//     }

//     console.log('!!!!IS BODY USED', response.bodyUsed);
//     return response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
// }


// async function streamCompletion(fetch: FetchClient, path: string, payload: any) {
//     const auth = await fetch._auth!();
//     const stream = new EventStream<string>();
//     const source = new EventSource(fetch.getUrl(path), {

//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": auth
//         },
//         body: JSON.stringify(payload),
//     });
//     source.addEventListener("output", (e: any) => {
//         stream.push(e.data);
//     });
//     source.addEventListener("error", (e: any) => {
//         let error: any;
//         try {
//             error = JSON.parse(e.data);
//         } catch (error) {
//             error = JSON.stringify(e);
//         }
//         this.logger?.error(e, error, "Error in SSE stream");
//     });
//     source.addEventListener("done", () => {
//         try {
//             stream.close(""); // not using e.data which is {}
//         } finally {
//             source.close();
//         }
//     });
//     return stream;
// }