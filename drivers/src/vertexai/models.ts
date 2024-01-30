import { AIModel, ModelType } from "@llumiverse/core";

// Builtin models. VertexAI doesn't provide an API to list models. so we have to hardcode them here.
export const BuiltinModels: AIModel<string>[] = [
    {
        id: "gemini-pro",
        name: "Gemini Pro",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Text,
    },
    { // ChatModel.from_pretrained("chat-bison@002")
        id: "chat-bison@002",
        name: "PaLM 2 Chat Bison",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Chat,
    },
    {
        id: "code-gecko@002",
        name: "Gecko Code Generation",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Code,
    },
    {
        id: "code-bison@002",
        name: "Bison Code Generation",
        provider: "vertexai",
        owner: "google",
        type: ModelType.Code,
    },
    {
        id: "codechat-bison@002",
        name: "Bison Code Chat",
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