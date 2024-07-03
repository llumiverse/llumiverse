import { DataSource, PromptRole, PromptSegment } from "@llumiverse/core"
import { JSONSchema4 } from "json-schema"
import { basename, resolve } from "path"
import { createReadStream } from "fs"
import { createReadableStreamFromReadable } from "node-web-stream-adapters";

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

class ImageSource implements DataSource {
    file: string;
    mime_type: "image/jpeg";
    constructor(file: string) {
        this.file = resolve(file);
    }
    get name() {
        return basename(this.file);
    }
    async getURL(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    async getStream(): Promise<ReadableStream<string | Uint8Array>> {
        const stream = createReadStream(this.file);
        return createReadableStreamFromReadable(stream);
    }
}

class ImageUrlSource implements DataSource {
    constructor(public url: string, public mime_type: string = "image/jpeg") {
    }
    get name() {
        return basename(this.url);
    }
    async getURL(): Promise<string> {
        return this.url;
    }
    async getStream(): Promise<ReadableStream<string | Uint8Array>> {
        const stream = await fetch(this.url).then(r => {
            if (!r.ok) {
                throw new Error("Failed to fetch image from url: " + this.url);
            }
            return r.body;
        })
        if (!stream) {
            throw new Error("No content from url: " + this.url);
        } else {
            return stream;
        }
    }
}

export const testPrompt_describeImage: PromptSegment[] = [
    {
        content: "You are a lab assistant analysing images of animals, then tag the images with accurate description of the animal shown in the picture.",
        role: PromptRole.user,
        files: [new ImageUrlSource("https://upload.wikimedia.org/wikipedia/commons/b/b2/WhiteCat.jpg")]
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