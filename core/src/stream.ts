
export async function readStreamAsBase64(stream: ReadableStream) {
    const out: Buffer[] = [];
    for await (const chunk of stream as any) {
        out.push(Buffer.from(chunk));
    }
    return Buffer.concat(out).toString('base64');
}
