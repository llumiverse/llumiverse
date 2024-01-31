import { EventSourceParser, ParsedEvent, createParser } from "eventsource-parser";
//import { EventSourceParserStream } from "eventsource-parser/stream";


export class EventSourceParserStream extends TransformStream<string, ParsedEvent> {
    constructor() {
        let parser!: EventSourceParser

        super({
            start(controller) {
                console.log('##########START => create new parser: ', parser);
                parser = createParser((event) => {
                    if (event.type === 'event') {
                        controller.enqueue(event)
                    }
                })
            },
            transform(chunk) {
                console.log('>>>>>>>>>>>>> TRANSFORM', chunk);
                parser.feed(chunk)
            },
        })
    }
}


export function sse(response: Response) {
    if (!response.ok) {
        const error = response.text();
        console.error('ERROR???', error)
        throw new Error(`Error ${response.status}: ${error}`);
    }
    if (!response.body) {
        throw new Error('No body in response');
    }
    return response.body.pipeThrough(new TextDecoderStream()); //.pipeThrough(new EventSourceParserStream());
}
