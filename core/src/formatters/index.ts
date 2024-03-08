import { JSONSchema4 } from "json-schema";
import { genericColonSeparator } from "./generic.js";
import { llama2 } from "./llama2.js";
import { openAI } from "./openai.js";
import {
    PromptFormats,
    PromptSegment
} from "../types.js";
import { claudeMessages } from "./claude.js";

export function inferFormatterFromModelName(modelName: string): PromptFormats {
    const name = modelName.toLowerCase();
    if (name.includes("llama")) {
        return PromptFormats.llama2;
    } else if (name.includes("gpt")) {
        return PromptFormats.openai;
    } else if (name.includes("claude")) {
        return PromptFormats.claude;
    } else {
        return PromptFormats.genericTextLLM;
    }
}

export const PromptFormatters: Record<
    PromptFormats,
    (messages: PromptSegment[], schema?: JSONSchema4) => any
> = {
    openai: openAI,
    llama2: llama2,
    claude: claudeMessages,
    genericTextLLM: genericColonSeparator,
};

