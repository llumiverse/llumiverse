import { EventSourceParserStream } from "eventsource-parser/stream";

export async function sse(response: Response) {
    if (!response.ok) {
        const text = await response.text();
        const error = new Error("SSE error: " + response.status + ". Content:\n" + text);
        (error as any).status = response.status;
        throw error;
    }
    if (!response.body) {
        throw new Error('No body in response');
    }
    //return response.body.pipeThrough(new TextDecoderStream());
    return response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
}
