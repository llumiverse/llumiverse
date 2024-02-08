import { describe, expect, test } from "vitest";
import { generateStreamingPrompt } from "../../src/vertexai/utils/tensor.js";

export const TEXT_PROMPT_NOSTREAM = {
    instances: [
        {
            prompt: "Hello"
        }
    ],
    parameters: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95,
    }
}

export const TEXT_PROMPT_STREAM = {
    inputs: [
        {
            structVal: {
                prompt: {
                    stringVal: "Hello"
                }
            }
        }
    ],
    parameters: {
        structVal: {
            temperature: { floatVal: 0.8 },
            maxOutputTokens: { intVal: 1024 },
            topK: { intVal: 40 },
            topP: { floatVal: 0.95 }
        }
    }
}

export const CHAT_PROMPT_NOSTREAM = {
    instances: [
        {
            messages: [
                {
                    author: "user",
                    content: "Hello",
                }
            ],
        }
    ],
    parameters: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95,
    }
}

export const CHAT_PROMPT_STREAM = {
    inputs: [
        {
            structVal: {
                messages: {
                    listVal: [
                        {
                            structVal: {
                                author: {
                                    stringVal: "user"
                                },
                                content: {
                                    stringVal: "Hello"
                                }
                            }
                        }
                    ]
                }
            }
        }
    ],
    parameters: {
        structVal: {
            temperature: { floatVal: 0.8 },
            maxOutputTokens: { intVal: 1024 },
            topK: { intVal: 40 },
            topP: { floatVal: 0.95 }
        }
    }
}

describe('VertexAI: Test generation of tensor stuctures used by serverStreamingPredict endpoints', () => {
    test('generate streaming prompt for text-bison', () => {
        expect(TEXT_PROMPT_STREAM).toEqual(generateStreamingPrompt(TEXT_PROMPT_NOSTREAM))
    });
    test('generate streaming prompt for chat-bison', () => {
        expect(CHAT_PROMPT_STREAM).toEqual(generateStreamingPrompt(CHAT_PROMPT_NOSTREAM))
    });

})

// console.log('====TEXT');
// logObject('##Expected result', TEXT_PROMPT_STREAM);
// logObject('!!Actual result', generateStreamingPrompt(TEXT_PROMPT_NOSTREAM));
// console.log('====CHAT');
// logObject('##Expected result', CHAT_PROMPT_STREAM);
// logObject('!!Actual result', generateStreamingPrompt(CHAT_PROMPT_NOSTREAM));
