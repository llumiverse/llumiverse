export const metadata = {
    title: 'Advanced Usage',
    model: 'gemini-1.5-pro',
    generated_at: '2024-08-21T17:42:58.841Z',
    }
    


    # Advanced Usage

This section covers more advanced use cases and features of the llumiverse library.

## Streaming

Streaming allows you to receive the LLM's output in real-time, rather than waiting for the entire response to be generated. This is useful for applications where you want to display the output to the user as it is being generated, such as chatbots or code completion tools.

To use streaming, you can use the `stream` method of the driver instead of the `execute` method. The `stream` method returns an `AsyncIterable<string>`, which you can iterate over to receive the output chunks as they are generated.

Here is an example of how to use streaming with the OpenAI driver:

<CodeGroup>
```typescript {{title: 'Composable SDK'}}
import { OpenAIDriver } from '@llumiverse/drivers';

const driver = new OpenAIDriver({ apiKey: 'YOUR_API_KEY' });

const stream = await driver.stream([
  { role: 'user', content: 'Hello, how are you?' },
], { model: 'gpt-3.5-turbo' });

for await (const chunk of stream) {
  console.log(chunk);
}
```

```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, how are you?"}],
    "stream": true
  }'
```
</CodeGroup>

**Use Cases:**

- **Chatbots:** Display the chatbot's responses as they are being generated, creating a more natural and engaging conversation flow.
- **Code Completion:** Show code suggestions as the user is typing, providing real-time assistance.
- **Live Transcription:** Transcribe audio or video in real-time, allowing for immediate feedback or analysis.

## Prompt Formatting

Prompt formatting plays a crucial role in controlling the LLM's behavior and generating the desired output. Here are some advanced techniques for formatting prompts:

- **Special Tokens:** Use special tokens to indicate specific instructions or delimiters to the LLM. For example, the Llama 2 model uses tokens like `<s>`, `</s>`, `[INST]`, and `[/INST]` to structure prompts.
- **Output Format:** Guide the LLM to generate output in a specific format, such as JSON, XML, or code. You can achieve this by providing examples in the prompt or using specific instructions.
- **System Messages:** Use system messages to set the context or persona for the LLM. This helps the LLM understand the desired tone, style, or behavior.

**Example:**

```
<<SYS>>
You are a helpful and informative assistant.
<</SYS>>

[INST]
Generate a list of five fruits in JSON format.
[/INST]
```

## Error Handling

Error handling is essential for ensuring the robustness of your LLM applications. Here are some common errors you may encounter and how to handle them:

- **Network Errors:** Handle network connectivity issues, timeouts, and other network-related errors.
- **Validation Errors:** Catch errors related to invalid input parameters, rate limiting, or authentication issues.
- **Result Validation Errors:** Validate the LLM's output against a JSON schema to ensure it conforms to the expected format and data types.

**Example:**

```typescript
try {
  const response = await driver.execute(segments, options);
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```

By incorporating these advanced techniques and error handling mechanisms, you can build more sophisticated and reliable LLM applications using the llumiverse library.


## Streaming

Streaming allows you to receive and process the LLM's output in real-time as it is being generated, rather than waiting for the entire response to be completed. This is particularly useful for:

- **Interactive applications:** Provide a more engaging user experience by displaying the output progressively.
- **Long-running tasks:** Start processing the output immediately, reducing the overall latency.
- **Real-time feedback:** Monitor the progress of the LLM and adjust the prompt or parameters if needed.

### Usage

To use streaming, call the `stream` method on the driver instance instead of `execute`. The `stream` method returns an `AsyncIterable` that yields chunks of the output as they become available.

<CodeGroup>
```typescript {{title: 'Composable SDK'}}
import { OpenAIDriver } from '@llumiverse/openai';

const driver = new OpenAIDriver({ apiKey: 'YOUR_API_KEY' });

const stream = await driver.stream([
  { role: 'user', content: 'Write a short story about a cat.' },
], { model: 'gpt-3.5-turbo' });

for await (const chunk of stream) {
  console.log(chunk);
}

// Access the complete response after the stream is finished
console.log(stream.completion); 
```

```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Write a short story about a cat."}],
    "stream": true
  }' \
  --output - | while IFS= read -r line; do
    if [[ "$line" == *"data: "* ]]; then
      echo "${line#data: }" | jq -r '.choices[0].delta.content'
    fi
  done
```
</CodeGroup>

### Example Use Cases

**1. Interactive Chatbot:**

```typescript
import { OpenAIDriver } from '@llumiverse/openai';

const driver = new OpenAIDriver({ apiKey: 'YOUR_API_KEY' });

async function chat() {
  let conversation = [{ role: 'system', content: 'You are a helpful assistant.' }];

  while (true) {
    const userInput = prompt('You: ');
    if (userInput === 'exit') break;

    conversation.push({ role: 'user', content: userInput });

    const stream = await driver.stream(conversation, { model: 'gpt-3.5-turbo' });

    process.stdout.write('Assistant: ');
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    process.stdout.write('\n');

    conversation.push({ role: 'assistant', content: stream.completion?.result });
  }
}

chat();
```

**2. Real-time Transcription:**

```typescript
import { WhisperDriver } from '@llumiverse/whisper';

const driver = new WhisperDriver();

const audioStream = // ... get audio stream from microphone or file

const transcriptionStream = await driver.stream(audioStream, { model: 'whisper-1' });

for await (const chunk of transcriptionStream) {
  console.log(chunk); // Display the transcribed text in real-time
}
```

### Notes

- Not all drivers and models support streaming. Refer to the specific driver documentation for details.
- The `completion` property of the `CompletionStream` object will be populated with the complete response after the stream is finished.
- Error handling is important when using streaming, as errors may occur during the streaming process.




## Prompt Formatting

The `llumiverse` library provides flexible ways to format prompts and control the LLM's behavior. This section covers advanced techniques for prompt formatting, including:

- Using special tokens for specific models
- Controlling the output format
- Using system messages to guide the LLM

### Special Tokens

Different LLM providers and models may use specific special tokens to structure and interpret prompts. The `llumiverse` library handles these nuances for you, but it's important to be aware of them when crafting your prompts.

For instance, models like Llama 2 utilize tokens like `<s>`, `</s>`, `[INST]`, `[/INST]`, `<<SYS>>`, and `<</SYS>>` to denote the beginning and end of the prompt, instructions, and system messages. When using the `llumiverse` library with Llama 2, you don't need to explicitly include these tokens in your prompt segments; the library will automatically format them correctly.

However, it's crucial to avoid using these special tokens within the content of your user messages, as this can disrupt the prompt structure and lead to unexpected results.

### Controlling Output Format

You can guide the LLM to generate output in a specific format, such as JSON, by providing a JSON schema in the execution options. This feature leverages the capabilities of providers like OpenAI and Bedrock that support function calling or structured output.

**Example:**

Let's say you want the LLM to generate a JSON object representing a person's information. You can define a JSON schema like this:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "age": {
      "type": "integer"
    },
    "city": {
      "type": "string"
    }
  },
  "required": [
    "name",
    "age",
    "city"
  ]
}
```

Then, you can include this schema in the `result_schema` property of your execution options:

```typescript
const options: ExecutionOptions = {
  model: "openai/gpt-3.5-turbo",
  result_schema: {
    // ... your JSON schema ...
  }
};
```

When the LLM generates the response, it will attempt to adhere to the provided schema, ensuring that the output is a valid JSON object with the specified properties.

### System Messages

System messages play a vital role in guiding the LLM's behavior and setting the context for the conversation. You can use system messages to provide instructions, define the LLM's persona, or establish specific rules for the interaction.

**Example:**

Suppose you want the LLM to act as a helpful assistant that provides concise answers. You can achieve this by including a system message like this:

```typescript
const segments: PromptSegment[] = [
  {
    role: PromptRole.system,
    content: "You are a helpful assistant. Please provide concise answers to my questions."
  },
  // ... your user messages ...
];
```

This system message sets the stage for the conversation, instructing the LLM to adopt a helpful persona and prioritize brevity in its responses.

By effectively using system messages, you can significantly influence the LLM's output and tailor its behavior to your specific needs.




## Error Handling

The llumiverse library provides mechanisms to handle errors that may occur during the execution of prompts or other operations. Errors can originate from various sources, including network issues, validation errors, rate limiting, or issues with the LLM provider.

Here's how you can handle errors when using the llumiverse library:

1. **Catching Errors**: Wrap your llumiverse calls in a `try...catch` block to handle potential errors.
2. **Error Object**: The caught error object may contain information about the error, such as:
   - `message`: A human-readable description of the error.
   - `code`: A specific error code (if available) that can help identify the type of error.
   - `prompt`: The original prompt that caused the error (added by the llumiverse driver).
   - `data`: Additional data related to the error, which may vary depending on the driver and the nature of the error.
3. **Error Logging**: Use the `logger` option in your driver configuration to log errors for debugging and monitoring.
4. **Specific Error Handling**: Based on the error code or message, you can implement specific error handling logic. For example, you might retry the request if it's a rate limiting error or display a user-friendly message for validation errors.

### Example Use Cases

Here are some examples of how to handle common errors:

**1. Handling Network Errors:**

```typescript
import { OpenAIDriver } from '@llumiverse/drivers';

const driver = new OpenAIDriver({ apiKey: 'your-api-key' });

try {
  const response = await driver.execute(
    [{ role: 'user', content: 'Translate this to French: Hello world!' }],
    { model: 'gpt-3.5-turbo' }
  );
  console.log(response.result);
} catch (error) {
  if (error.code === 'network_error') {
    console.error('Network error occurred. Please check your internet connection.');
  } else {
    console.error('An error occurred:', error);
  }
}
```

**2. Handling Validation Errors:**

```typescript
import { OpenAIDriver, PromptRole } from '@llumiverse/drivers';

const driver = new OpenAIDriver({ apiKey: 'your-api-key' });

try {
  const response = await driver.execute(
    [{ role: PromptRole.user, content: 'Generate a random number.' }],
    {
      model: 'gpt-3.5-turbo',
      result_schema: {
        type: 'integer',
      },
    }
  );
  console.log(response.result);
} catch (error) {
  if (error.code === 'validation_error') {
    console.error('Validation error:', error.message);
    console.error('Invalid data:', error.data);
  } else {
    console.error('An error occurred:', error);
  }
}
```

**3. Handling Rate Limiting Errors:**

```typescript
import { OpenAIDriver, PromptRole } from '@llumiverse/drivers';

const driver = new OpenAIDriver({ apiKey: 'your-api-key' });

const MAX_RETRIES = 3;
let retries = 0;

async function executePrompt() {
  try {
    const response = await driver.execute(
      [{ role: PromptRole.user, content: 'Tell me a joke.' }],
      { model: 'gpt-3.5-turbo' }
    );
    console.log(response.result);
  } catch (error) {
    if (error.code === 'rate_limit_error' && retries < MAX_RETRIES) {
      retries++;
      const retryDelay = 2 ** retries * 1000; // Exponential backoff
      console.warn(`Rate limit exceeded. Retrying in ${retryDelay / 1000} seconds...`);
      setTimeout(executePrompt, retryDelay);
    } else {
      console.error('An error occurred:', error);
    }
  }
}

executePrompt();
```

By effectively handling errors, you can ensure the robustness and reliability of your applications that interact with LLMs through the llumiverse library.


