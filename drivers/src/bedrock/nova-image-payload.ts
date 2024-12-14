import { ImageGenExecutionOptions, PromptSegment, readStreamAsBase64 } from "@llumiverse/core";



async function textToImagePayload(segments: PromptSegment[], options: ImageGenExecutionOptions): Promise<NovaTextToImagePayload> {

    const imageProvided = segments.some((s) => s.files?.length && s.files?.length > 0);

    const conditionImage = async () => {
        if (!imageProvided) {
            return undefined;
        }
        if (options.input_image_use === "inspiration") {
            return segments[0].files![0].getStream().then((stream) => readStreamAsBase64(stream));
        }
        return undefined;
    }


    let payload: NovaTextToImagePayload = {
        taskType: NovaImageGenerationTaskType.TEXT_IMAGE,
        imageGenerationConfig: {
            quality: "standard",
            width: options.width,
            height: options.height,
        },
        textToImageParams: {
            text: segments.map(s => s.content).join(" "),
            conditionImage: await conditionImage(),
        }
    }

    return payload;
}

async function imageVariationPayload(segments: PromptSegment[], options: ImageGenExecutionOptions): Promise<NovaImageVariationPayload> {

    const imageProvided = segments.some((s) => s.files?.length && s.files?.length > 0);

    const images = async () => {
        if (!imageProvided || !segments.some((s) => s.files?.length && s.files?.length > 0)) {
            throw new Error("No images provided for image variation");
        }

        const images = await Promise.all(segments.map(async (s) => {
            if (s.files && s.files.length > 0) {
                const source = await s.files[0].getStream();
                const data = await readStreamAsBase64(source);
                return data;
            }
            return undefined;
        }));


        return images.filter((i) => i !== undefined);
    }

    let payload: NovaImageVariationPayload = {
        taskType: NovaImageGenerationTaskType.IMAGE_VARIATION,
        imageGenerationConfig: {
            quality: "standard",
            width: options.width,
            height: options.height,
        },
        imageVariationParams: {
            images: await images(),
            text: segments.map(s => s.content).join(" "),
        }
    }

    return payload;

}


export function formatNovaImageGenerationPayload(taskType: NovaImageGenerationTaskType, segments: PromptSegment[], options: ImageGenExecutionOptions) {

    switch (taskType) {
        case NovaImageGenerationTaskType.TEXT_IMAGE:
            return textToImagePayload(segments, options);
        case NovaImageGenerationTaskType.IMAGE_VARIATION:
            return imageVariationPayload(segments, options);
        default:
            throw new Error("Task type not supported");
    }

}



export interface InvokeModelPayloadBase {

    taskType: NovaImageGenerationTaskType;
    imageGenerationConfig: {
        width?: number;
        height?: number;
        quality: "standard" | "premium";
        cfgScale?: number;
        seed?: number;
        numberOfImages?: number;
    };
}

export interface NovaTextToImagePayload extends InvokeModelPayloadBase {

    textToImageParams: {
        conditionImage?: string;
        controlMode?: "CANNY_EDGE" | "SEGMENTATION";
        controlStrength?: number;
        text: string;
        negativeText?: string;
    };

}


export interface NovaImageVariationPayload extends InvokeModelPayloadBase {
    imageVariationParams: {
        images: string[]  //(list of Base64 encoded images),
        similarityStrength?: number,
        text?: string,
        negativeText?: string
    }
}


export enum NovaImageGenerationTaskType {
    TEXT_IMAGE = "TEXT_IMAGE",
    COLOR_GUIDED_GENERATION = "COLOR_GUIDED_GENERATION",
    IMAGE_VARIATION = "IMAGE_VARIATION",
    INPAINTING = "INPAINTING",
    OUTPAINTING = "OUTPAINTING",
    BACKGROUND_REMOVAL = "BACKGROUND_REMOVAL",
}