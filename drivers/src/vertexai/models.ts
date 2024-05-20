import { AIModel, Completion, ExecutionOptions, ModelType, PromptOptions, PromptSegment } from "@llumiverse/core";
import { VertexAIDriver } from "./index.js";
import { CodeyChatDefinition } from "./models/codey-chat.js";
import { CodeyTextDefinition } from "./models/codey-text.js";
import { GeminiModelDefinition } from "./models/gemini.js";
import { Palm2ChatDefinition } from "./models/palm2-chat.js";
import { Palm2TextDefinition } from "./models/palm2-text.js";



export interface ModelDefinition<PromptT = any> {
    model: AIModel;
    versions?: string[]; // the versions of the model that are available. ex: ['001', '002']
    createPrompt: (driver: VertexAIDriver, segments: PromptSegment[], options: PromptOptions) => PromptT;
    requestCompletion: (driver: VertexAIDriver, prompt: PromptT, options: ExecutionOptions) => Promise<Completion>;
    requestCompletionStream: (driver: VertexAIDriver, promp: PromptT, options: ExecutionOptions) => Promise<AsyncIterable<string>>;
}

export function getModelName(model: string) {
    const i = model.lastIndexOf('@');
    return i > -1 ? model.substring(0, i) : model;
}

export function getModelDefinition(model: string): ModelDefinition {
    const modelName = getModelName(model);
    const def = Models[modelName];
    if (!def) {
        throw new Error(`Unknown model ${model}`);
    }
    return def;
}

export function getAIModels() {
    return Object.values(Models).map(m => m.model);
}

// Builtin models. VertexAI doesn't provide an API to list models. so we have to hardcode them here.
export const BuiltinModels: AIModel<string>[] = [
    {
        id: "gemini-1.5-flash-preview-0514",
        name: "Gemini Pro 1.5 Flash (0514 Preview)",
        provider: "vertexai",
        owner: "google",
        type: ModelType.MultiModal,
    },
    {
        id: "gemini-1.5-pro-preview-0514",
        name: "Gemini Pro 1.5 Pro (0514 Preview)",
        provider: "vertexai",
        owner: "google",
        type: ModelType.MultiModal,
    },
    {
        id: "gemini-1.0-pro",
        name: "Gemini Pro 1.0",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },
    { // ChatModel.from_pretrained("chat-bison@002")
        id: "chat-bison",
        name: "PaLM 2 Chat Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Chat,
    },
    {
        id: "text-bison", // versions 001, 002
        name: "PaLM 2 Text Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },
    {
        id: "code-gecko",
        name: "Codey for Code Completion",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Code,
    },
    {
        id: "code-bison",
        name: "Codey for Code Generation",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Code,
    },
    {
        id: "codechat-bison",
        name: "Codey for Code Chat",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Code,
    },
    {
        id: "tablextembedding-gecko",
        name: "Gecko Text Embeddings",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Embedding,
    },
    {
        id: "textembedding-gecko-multilingual",
        name: "Gecko Multilingual Text Embeddings",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Embedding,
    },



]



const Models: Record<string, ModelDefinition> = {
    "gemini-1.5-flash-preview-0514": new GeminiModelDefinition("gemini-1.5-flash-preview-0514"),
    "gemini-1.5-pro-preview-0514": new GeminiModelDefinition("gemini-1.5-pro-preview-0514"),
    "gemini-1.0-pro": new GeminiModelDefinition(),
    "text-bison": new Palm2TextDefinition(),
    "chat-bison": new Palm2ChatDefinition(),
    "code-bison": new CodeyTextDefinition(),
    "codechat-bison": new CodeyChatDefinition(),
}
