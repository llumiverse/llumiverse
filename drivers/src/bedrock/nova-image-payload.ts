import { ImageGenExecutionOptions, PromptSegment, readStreamAsBase64 } from "@llumiverse/core";

async function textToImagePayload(prompt: PromptSegment[], options: ImageGenExecutionOptions): Promise<NovaTextToImagePayload> {

    const text = prompt.map(m => m.content).join("\n\n");
    const imageProvided = prompt.some(s => s.files);

    const conditionImage = async () => {
        if (!imageProvided) {
            return undefined;
        }
        if (options.input_image_use === "inspiration") {
            return prompt[0]?.files ? (await readStreamAsBase64(await prompt[0].files[0].getStream())) : undefined;
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
            text: text,
            conditionImage: await conditionImage(),
        }
    }

    return payload;
}

async function imageVariationPayload(prompt: PromptSegment[], options: ImageGenExecutionOptions): Promise<NovaImageVariationPayload> {

    const text = prompt.map(m => m.content).join("\n\n");
    const imageProvided = prompt.some(s => s.files);

    const images = async () => {
        if (!imageProvided) {
            throw new Error("No images provided for image variation");
        }

        const images = await Promise.all(prompt.map(async (m) => {
            return m.files ? (await readStreamAsBase64(await m.files[0].getStream())) : undefined;
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
            text: text,
        }
    }

    return payload;

}


export function formatNovaImageGenerationPayload(taskType: NovaImageGenerationTaskType, prompt: PromptSegment[], options: ImageGenExecutionOptions) {

    switch (taskType) {
        case NovaImageGenerationTaskType.TEXT_IMAGE:
            return textToImagePayload(prompt, options);
        case NovaImageGenerationTaskType.IMAGE_VARIATION:
            return imageVariationPayload(prompt, options);
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