

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
    const out: Buffer[] = [];

    for await (const chunk of stream as any) {
        out.push(Buffer.from(chunk));
        //const encoded = Buffer.from(chunk).toString('base64');
        //out.push(encoded);
    }

    return Buffer.concat(out).toString('base64');
    // console.log("#============================================================#");
    // console.log(out.join(''));
    // console.log("#============================================================#");
    //return out.join('');
}
