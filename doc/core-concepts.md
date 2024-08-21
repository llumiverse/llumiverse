export const metadata = {
    title: 'Core Concepts',
    model: 'gemini-1.5-pro',
    generated_at: '2024-08-21T17:27:55.477Z',
    }
    


    # Core Concepts

The llumiverse library is built around a few core concepts that work together to provide a unified and flexible way to interact with Large Language Models (LLMs). This section explains these core concepts and how they are used to structure and execute prompts.

## Drivers

Drivers are the heart of the llumiverse library. They are responsible for interacting with specific LLM providers, such as OpenAI, Bedrock, Hugging Face, and others. Each driver implements a common interface, allowing you to switch between different providers seamlessly without changing your application code.

Here is a list of currently supported drivers:

-   **OpenAI Driver:** Interacts with the OpenAI API.
-   **Bedrock Driver:** Interacts with the Amazon Bedrock API.
-   **Hugging Face Inference Endpoint Driver:** Interacts with Hugging Face Inference Endpoints.
-   **Replicate Driver:** Interacts with the Replicate API.
-   **TogetherAI Driver:** Interacts with the TogetherAI API.
-   **VertexAI Driver:** Interacts with the Google Vertex AI API.
-   **Watsonx Driver:** Interacts with the IBM Watsonx API.
-   **Groq Driver:** Interacts with the Groq API.
-   **MistralAI Driver:** Interacts with the MistralAI API.
-   **Test Driver:** A mock driver for testing purposes.

Each driver has its own configuration options, such as API keys, endpoint URLs, and other provider-specific settings. You can find detailed information about each driver and its configuration in the [Drivers](./drivers/index.md) section.

## Prompt Segments

Prompt segments are used to structure your prompts and provide context to the LLM. They are defined as objects with a `role` and `content` property. The `role` property indicates the purpose of the segment, while the `content` property contains the actual text of the segment.

There are four main prompt roles:

-   **`system`:** Provides general instructions or context to the LLM.
-   **`user`:** Represents the user's input or query.
-   **`assistant`:** Represents the LLM's response.
-   **`safety`:** Provides safety guidelines or constraints to the LLM.

By combining these roles, you can create complex prompts that guide the LLM's behavior and ensure that its responses are relevant and appropriate.

For example, the following prompt segments define a simple interaction where the user asks the LLM to translate a phrase into Spanish:

```typescript
import { PromptRole, PromptSegment } from "@llumiverse/core";

const segments: PromptSegment[] = [
    { role: PromptRole.system, content: "You are a helpful assistant that translates English to Spanish." },
    { role: PromptRole.user, content: "Translate the following phrase into Spanish: Hello, how are you?" },
];
```

## Execution Options

Execution options control the behavior of the LLM during prompt execution. They are passed as an object to the driver's `execute` or `stream` methods.

Some common execution options include:

-   **`model`:** The name of the LLM model to use.
-   **`temperature`:** Controls the randomness of the LLM's output. Higher values result in more creative and unpredictable responses.
-   **`max_tokens`:** Limits the maximum number of tokens in the LLM's response.
-   **`stop_sequence`:** Specifies a sequence of tokens that will stop the LLM's generation.
-   **`result_schema`:** A JSON Schema that defines the expected structure of the LLM's response. This allows you to validate and parse the response easily.

For example, the following execution options configure the OpenAI driver to use the `gpt-3.5-turbo` model, set the temperature to 0.8, and limit the response to 50 tokens:

```typescript
import { ExecutionOptions } from "@llumiverse/core";

const options: ExecutionOptions = {
    model: "gpt-3.5-turbo",
    temperature: 0.8,
    max_tokens: 50,
};
```

## Putting It All Together

To execute a prompt using the llumiverse library, you first need to create a driver instance for your chosen LLM provider. Then, you define your prompt segments and execution options. Finally, you call the driver's `execute` or `stream` method, passing in the prompt segments and options.

Here is a complete example that demonstrates how to translate a phrase into Spanish using the OpenAI driver:

```typescript
import { OpenAIDriver } from "@llumiverse/drivers";
import { PromptRole, PromptSegment } from "@llumiverse/core";

// Create an OpenAI driver instance
const driver = new OpenAIDriver({ apiKey: "YOUR_OPENAI_API_KEY" });

// Define the prompt segments
const segments: PromptSegment[] = [
    { role: PromptRole.system, content: "You are a helpful assistant that translates English to Spanish." },
    { role: PromptRole.user, content: "Translate the following phrase into Spanish: Hello, how are you?" },
];

// Define the execution options
const options = {
    model: "gpt-3.5-turbo",
};

// Execute the prompt and log the response
driver.execute(segments, options).then((response) => {
    console.log(response.result); // Output: Hola, ¿cómo estás?
});
```

This example shows how the core concepts of drivers, prompt segments, and execution options work together to provide a simple and powerful way to interact with LLMs. The llumiverse library provides a flexible and extensible framework for building LLM-powered applications, allowing you to choose the best provider and model for your specific needs.


## Drivers

Drivers are responsible for interacting with specific LLM providers. They abstract away the complexities of different APIs and provide a unified interface for executing prompts, streaming responses, and managing models.

The `llumiverse` library supports a wide range of drivers for popular LLM providers, including:

- OpenAI
- Bedrock (AWS)
- Hugging Face Inference Endpoints
- Replicate
- TogetherAI
- VertexAI (Google Cloud)
- Watsonx (IBM Cloud)
- Groq
- MistralAI
- Test Driver (for testing and debugging)

Each driver has its own specific configuration options and usage patterns. Refer to the dedicated documentation for each driver for detailed instructions.

Here is a simple example demonstrating how to use the OpenAI driver to execute a prompt:

```typescript
import { OpenAIDriver } from '@llumiverse/drivers';

const driver = new OpenAIDriver({
  apiKey: 'YOUR_OPENAI_API_KEY',
});

const response = await driver.execute(
  [
    {
      role: 'user',
      content: 'Hello world!',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
  }
);

console.log(response.result); // The LLM's response
```

**Use Cases:**

- **Building a chatbot:** Use the `stream` method of a driver to receive the LLM's output in real-time and create a conversational experience.
- **Generating content:** Use the `execute` method to generate text, code, or other content based on a given prompt.
- **Fine-tuning LLMs:** Use the `startTraining`, `cancelTraining`, and `getTrainingJob` methods to fine-tune a model on your own data.
- **Managing models:** Use the `listModels` and `listTrainableModels` methods to discover and manage available models.

**Key Concepts:**

- **Provider:** The name of the LLM provider (e.g., "openai", "bedrock").
- **Model:** The specific LLM model to use (e.g., "gpt-3.5-turbo", "anthropic.claude-v2").
- **Prompt:** The input text or instructions provided to the LLM.
- **Response:** The output generated by the LLM.
- **Streaming:** The ability to receive the LLM's output in real-time.
- **Fine-tuning:** The process of training an LLM on your own data to improve its performance on specific tasks.




## Prompt Segments

Prompt segments are the building blocks of a prompt in llumiverse. They allow you to structure your prompts in a way that is clear and easy to understand for both you and the LLM. Each segment has a specific role, which tells the LLM how to interpret the content of the segment.

There are four main roles for prompt segments:

- **system**: This role is used to provide general instructions or context to the LLM. For example, you could use a system message to tell the LLM to act as a helpful assistant or to provide some background information about the task at hand.
- **user**: This role is used to provide the LLM with the actual input for the task. For example, if you are asking the LLM to translate a sentence, the user message would contain the sentence to be translated.
- **assistant**: This role is used to provide the LLM with examples of how to respond to user messages. This is especially useful for tasks that require a specific format or style of response.
- **safety**: This role is used to provide the LLM with safety guidelines. This can be used to prevent the LLM from generating harmful or offensive content.

Here is an example of how prompt segments can be used to create a prompt for a translation task:

```typescript
import { PromptRole, PromptSegment } from "@llumiverse/core";

const segments: PromptSegment[] = [
  {
    role: PromptRole.system,
    content: "You are a helpful assistant that translates English to French.",
  },
  {
    role: PromptRole.user,
    content: "Translate the following sentence to French: Hello, how are you?",
  },
];
```

In this example, the system message tells the LLM that it should act as a helpful assistant that translates English to French. The user message then provides the sentence to be translated.

You can also use prompt segments to create more complex prompts, such as prompts for chatbots or question answering systems. For example, here is a prompt for a chatbot that can answer questions about a specific topic:

```typescript
import { PromptRole, PromptSegment } from "@llumiverse/core";

const segments: PromptSegment[] = [
  {
    role: PromptRole.system,
    content:
      "You are a helpful chatbot that can answer questions about the solar system.",
  },
  {
    role: PromptRole.user,
    content: "What is the largest planet in the solar system?",
  },
  {
    role: PromptRole.assistant,
    content: "The largest planet in the solar system is Jupiter.",
  },
  {
    role: PromptRole.user,
    content: "How many moons does Jupiter have?",
  },
];
```

In this example, the system message tells the LLM that it should act as a chatbot that can answer questions about the solar system. The user and assistant messages then provide a sample conversation that the LLM can use to learn how to respond to user questions.

By using prompt segments, you can create prompts that are clear, concise, and easy for the LLM to understand. This will help you to get better results from your LLM applications.




## Execution Options

The `ExecutionOptions` interface allows you to control the behavior of the LLM during execution. It extends the `PromptOptions` interface and includes additional parameters that influence the generation process.

### Properties

| Property | Type | Description |
|---|---|---|
| `model` | `string` | The name of the model to use for execution. **Required**. |
| `format` | `PromptFormatter` | A custom formatter to use for formatting the final model prompt from the input prompt segments. If none is specified, the driver will choose a formatter compatible with the target model. **Optional**. |
| `result_schema` | `JSONSchema4` | A JSON Schema used to validate the result. If the result is not valid JSON or does not match the schema, an error will be returned. **Optional**. |
| `temperature` | `number` | Controls the randomness of the generated text. Higher values (closer to 1) result in more random output, while lower values (closer to 0) make the output more deterministic. Defaults to 0.7. **Optional**. |
| `max_tokens` | `number` | The maximum number of tokens to generate. Defaults to 2048. **Optional**. |
| `stop_sequence` | `string` or `string[]` | A sequence or array of sequences that will stop the text generation process. **Optional**. |
| `top_k` | `number` | Restricts the selection of tokens to the "k" most likely options, based on their probabilities. Lower values make the model more deterministic and focused. Ignored on OpenAI since it does not support it. **Optional**. |
| `top_p` | `number` | An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered. Either use temperature or top_p, not both. **Optional**. |
| `top_logprobs` | `number` | Only supported for OpenAI. Refer to OpenAI documentation for more details. **Optional**. |
| `presence_penalty` | `number` | Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics. Ignored for models that don't support it. **Optional**. |
| `frequency_penalty` | `number` | Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim. Ignored for models that don't support it. **Optional**. |
| `include_original_response` | `boolean` | If set to true, the original response from the target LLM will be included in the response under the `original_response` field. This is useful for debugging and for some advanced use cases. It is ignored on streaming requests. **Optional**. |

### Examples

#### Using Temperature

```typescript
const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
  temperature: 0.9, // High temperature for more creative output
});
```

#### Using Max Tokens

```typescript
const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
  max_tokens: 50, // Limit the response to 50 tokens
});
```

#### Using a Stop Sequence

```typescript
const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
  stop_sequence: "\n", // Stop the generation when a newline character is encountered
});
```

#### Using Result Schema Validation

```typescript
const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" },
  },
  required: ["name", "age"],
};

const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
  result_schema: schema, // Validate the result against the schema
});
```

#### Including the Original Response

```typescript
const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
  include_original_response: true, // Include the original response from the LLM
});
```

### Notes

- The `temperature`, `max_tokens`, `stop_sequence`, `top_k`, `top_p`, `top_logprobs`, `presence_penalty`, and `frequency_penalty` options may not be supported by all LLMs. Refer to the documentation of the specific LLM provider for details.
- The `include_original_response` option is only supported for non-streaming requests.
- The `result_schema` option allows you to enforce a specific structure for the LLM's output, making it easier to parse and use in your application.
- The `format` option allows you to customize the prompt formatting for specific LLMs or use cases.


