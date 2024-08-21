export const metadata = {
    title: 'Getting Started',
    model: 'gemini-1.5-pro',
    generated_at: '2024-08-21T17:24:45.430Z',
    }
    


    # Getting Started

The llumiverse library provides a unified and abstract way to interact with various Large Language Models (LLMs) from different providers. This guide will walk you through the installation process and demonstrate basic usage with a simple "Hello world" example.

## Installation

Install the llumiverse library using npm or yarn:

<CodeGroup>

```bash {{title: 'npm'}}
npm install @llumiverse/core
```

```bash {{title: 'yarn'}}
yarn add @llumiverse/core
```

</CodeGroup>

## Basic Usage

Here's a basic example demonstrating how to create a driver, format a prompt, and execute it using the OpenAI driver:

```typescript
import { OpenAIDriver, PromptRole } from '@llumiverse/core';

// Replace with your actual OpenAI API key
const apiKey = 'YOUR_OPENAI_API_KEY';

// Create an instance of the OpenAI driver
const driver = new OpenAIDriver({ apiKey });

// Define the prompt segments
const segments = [
  {
    role: PromptRole.user,
    content: 'Hello world!',
  },
];

// Execute the prompt and log the result
driver.execute(segments, { model: 'gpt-3.5-turbo' })
  .then(response => console.log(response.result))
  .catch(error => console.error(error));
```

**Explanation:**

1. **Import necessary classes:** Import `OpenAIDriver` and `PromptRole` from the llumiverse library.
2. **Set up the driver:** Create an instance of the `OpenAIDriver` with your OpenAI API key.
3. **Define the prompt:** Create an array of `PromptSegment` objects, each representing a part of the conversation. In this case, we have a single user message with the content "Hello world!".
4. **Execute the prompt:** Call the `execute` method on the driver, passing the prompt segments and execution options. The `model` option specifies the LLM to use (here, it's `gpt-3.5-turbo`).
5. **Handle the response:** The `execute` method returns a promise that resolves with the execution response. We log the `result` property of the response, which contains the LLM's output.

This example showcases a simple "Hello world" interaction. The llumiverse library supports more complex prompts and interactions with various LLM providers. For more advanced usage and details about drivers, prompt segments, and execution options, refer to the subsequent sections of this documentation.


## Installation

You can install the llumiverse library using npm or yarn:

<CodeGroup>
```bash {{title: 'npm'}}
npm install @llumiverse/core
```

```bash {{title: 'yarn'}}
yarn add @llumiverse/core
```
</CodeGroup>




## Basic Usage

This section provides a simple example of how to use the llumiverse library to execute a prompt.

First, you need to install the library:

```bash
npm install @llumiverse/core
```

Then, you can use the following code to execute a simple "Hello world" prompt:

<CodeGroup>
```typescript {{title: 'Composable SDK'}}
import { OpenAIDriver } from '@llumiverse/core/drivers';

// Replace with your actual API key
const apiKey = 'YOUR_API_KEY';

// Create a new OpenAI driver
const driver = new OpenAIDriver({ apiKey });

// Define the prompt segments
const segments = [
  {
    role: 'user',
    content: 'Hello world',
  },
];

// Execute the prompt and log the result
driver.execute(segments, { model: 'gpt-3.5-turbo' })
  .then((response) => {
    console.log(response.result);
  })
  .catch((error) => {
    console.error(error);
  });
```

```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello world"
    }
  ]
}'
```
</CodeGroup>

This code will:

1. Create a new OpenAI driver with your API key.
2. Define a prompt segment with the role "user" and the content "Hello world".
3. Execute the prompt using the `execute` method of the driver, specifying the model to use (`gpt-3.5-turbo` in this case).
4. Log the result of the prompt execution to the console.

The expected output is:

```
Hello world!
```

This is a very basic example, but it demonstrates the core concepts of the llumiverse library:

* **Drivers:** Drivers are responsible for interacting with specific LLM providers. In this example, we are using the `OpenAIDriver`.
* **Prompt Segments:** Prompt segments are used to structure prompts and define the roles of different parts of the prompt.
* **Execution Options:** Execution options control the behavior of the LLM, such as the model to use, the temperature, and the maximum number of tokens to generate.

The llumiverse library provides a powerful and flexible way to interact with LLMs, and this basic example is just the starting point. You can explore the other sections of this documentation to learn more about the advanced features and capabilities of the library.


