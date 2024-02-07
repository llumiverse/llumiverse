# Llumiverse - Universal LLM Connectors for Node.js

![Build](https://github.com/llumiverse/llumiverse/actions/workflows/node.js.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40llumiverse%2Fcore.svg)](https://badge.fury.io/js/%40llumiverse%2Fcore)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

LLumiverse is a universal interface for interacting with Large Language Models, for the Typescript/Javascript ecosystem. It provides a lightweight modular library for interacting with various LLM models and execution platforms.

It solely focuses on abstracting LLMs and their execution platforms, and does not provide prompt templating, or RAG, or chains, letting you pick the best tool for the job.

The following LLM platforms are supported in the current version:


| Provider | Completion | Chat | Model Listing | Fine-Tuning |
| -------- | ---------- | ---- | ------------- | ----------- |
| OpenAI    | ✅        | ✅    | ✅            | ✅          |
| Replicate | ✅        | ✅    | ✅            | ✅          |
| AWS Bedrock | ✅      | ✅    | ✅            | ✅          |
| HuggingFace Inference Endpoints | ✅ | ✅ | N/A | N/A       |
| Google Vertex AI | ✅ | ✅ | Partial | In Progress |
| Together AI| ✅ | ✅ | ✅ | In Progress |

New capabilities and platform can easily be added by creating a new driver for the platform.


## Requirements

* node v18+, or bun 1.0+

## Installation 

1. If you want to use llumiverse to execute prompt completion on various supported providers then install `@llumiverse/core` and `@llumiverse/drivers`

```
npm install @llumiverse/core @llumiverse/drivers
```

2. If you only want to use typescript types or other structures from llumiverse you only need to install `@llumiverse/core`

```
npm install @llumiverse/core
```

3. If you want to develop a new llumiverse driver for an ussuported LLM provider you only need to install `@llumiverse/core`

```
npm install @llumiverse/core
```

## Usage

Here is an example on using the OpenAI driver. Apart the driver configuration and the target model (which depends on the driver) the code will work with any driver.

```javascript
import { AIModel, PromptRole, PromptSegment } from "@llumiverse/core";
import { OpenAIDriver } from "@llumiverse/drivers";

// create an instance of the OpenAI driver 
const openai = new OpenAIDriver({
    apiKey: "YOUR_OPENAI_API_KEY",
    logger: false
});

// list available models on your OpenAI account
const models: AIModel[] = await openai.listModels();

console.log('# Available OpenAI Models:');
for (const model of models) {
    console.log(`${model.name} [${model.id}]`);
}
```

### Execute a prompt 

Here is an example oin how to execute a prompt. We will pick OpenAI aghain, but the code works with any other driver.

```javascript
import { AIModel, PromptRole, PromptSegment } from "@llumiverse/core";
import { OpenAIDriver } from "@llumiverse/drivers";

// create an instance of the OpenAI driver 
const openai = new OpenAIDriver({
    apiKey: "YOUR_OPENAI_API_KEY",
    logger: false
});

// create the prompt. The prompt format is shared between all drivers
const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: 'Write please a short story about Paris in winter in no more than 512 characters.'
    }
]

// execute a model (blocking)
console.log('\n# Executing prompt on model gpt-3.5-turbo: ', prompt);
const response = await openai.execute(prompt, {
    model: 'gpt-3.5-turbo',
    temperature: 0.6,
    max_tokens: 1024
});

console.log('\n# LLM response:', response.result)
console.log('# Response took', response.execution_time, 'ms')
console.log('# Token usage:', response.token_usage);
```

### Execute a prompt in streaming mode

Here is the  same example above but in streaming mode:

```javascript
import { AIModel, PromptRole, PromptSegment } from "@llumiverse/core";
import { OpenAIDriver } from "@llumiverse/drivers";

// create an instance of the OpenAI driver 
const openai = new OpenAIDriver({
    apiKey: "YOUR_OPENAI_API_KEY",
    logger: false
});

// create the prompt. The prompt format is shared between all drivers
const prompt: PromptSegment[] = [
    {
        role: PromptRole.user,
        content: 'Write please a short story about Paris in winter in no more than 512 characters.'
    }
]

// execute the prompt in streaming mode 
console.log('\n# Executing the prompt in streaming mode on model gpt-3.5-turbo: ', prompt);
const stream = await openai.stream(prompt, {
    model: 'gpt-3.5-turbo',
    temperature: 0.6,
    max_tokens: 1024
});

// show the streaming response as it comes
for await (const chunk of stream) {
    process.stdout.write(chunk);
}

// when the response stream is consumed we can get the final reponse using stream.completion field.
const streamingResponse = stream.completion!;

console.log('\n# LLM response:', streamingResponse.result)
console.log('# Response took', streamingResponse.execution_time, 'ms')
console.log('# Token usage:', streamingResponse.token_usage);
```

## Contributing

Contributions are welcome!
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.


## License

Llumivers is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Feel free to use it accordingly.
