

export class Base64Stream extends TransformStream {

    constructor() {
        super({
            transform(chunk: Uint8Array, controller: TransformStreamDefaultController<string>) {
                const buffer = Buffer.from(chunk);
                const output = buffer.toString('base64');
                if (output.length > 0) {
                    controller.enqueue(output);
                }
            },
            flush() {
                // do nothing
            }
        });
    }
}

export async function readStreamAsBase64(stream: ReadableStream) {
    const out: string[] = [];
    for await (const chunk of stream as any) {
        const encoded = Buffer.from(chunk).toString('base64');
        out.push(encoded);
    }
    return out.join('');
}
