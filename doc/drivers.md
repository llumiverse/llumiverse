export const metadata = {
    title: 'Drivers',
    model: 'gemini-1.5-pro',
    generated_at: '2024-08-21T17:40:33.548Z',
    }
    


    # Drivers

Drivers are responsible for interacting with specific LLM providers. They provide a unified interface for executing prompts, managing models, and handling responses.

## Supported Drivers

The llumiverse library currently supports the following drivers:

- [OpenAI Driver](#openai-driver)
- [Bedrock Driver](#bedrock-driver)
- [Hugging Face Inference Endpoint Driver](#hugging-face-inference-endpoint-driver)
- [Replicate Driver](#replicate-driver)
- [TogetherAI Driver](#togetherai-driver)
- [VertexAI Driver](#vertexai-driver)
- [Watsonx Driver](#watsonx-driver)
- [Groq Driver](#groq-driver)
- [MistralAI Driver](#mistralai-driver)
- [Test Driver](#test-driver)

## OpenAI Driver

The OpenAI driver allows you to interact with the OpenAI API.

### Installation

```bash
npm install @llumiverse/openai
```

### Usage

```typescript
import { OpenAIDriver } from "@llumiverse/openai";

const driver = new OpenAIDriver({
  apiKey: "YOUR_OPENAI_API_KEY",
});
```

### Example

```typescript
import { OpenAIDriver } from "@llumiverse/openai";
import { PromptRole } from "@llumiverse/core";

const driver = new OpenAIDriver({
  apiKey: "YOUR_OPENAI_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}'
```

```typescript {{title: 'Composable SDK'}}
import { OpenAIDriver } from "@llumiverse/openai";
import { PromptRole } from "@llumiverse/core";

const driver = new OpenAIDriver({
  apiKey: "YOUR_OPENAI_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "gpt-3.5-turbo",
});

console.log(response.result);
```
</CodeGroup>

## Bedrock Driver

The Bedrock driver allows you to interact with the Amazon Bedrock API.

### Installation

```bash
npm install @llumiverse/bedrock
```

### Usage

```typescript
import { BedrockDriver } from "@llumiverse/bedrock";

const driver = new BedrockDriver({
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
  },
});
```

### Example

```typescript
import { BedrockDriver } from "@llumiverse/bedrock";
import { PromptRole } from "@llumiverse/core";

const driver = new BedrockDriver({
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
  },
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "anthropic.claude-v2",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=YOUR_AWS_ACCESS_KEY_ID/20231115/us-east-1/bedrock/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=YOUR_AWS_SIGNATURE" \
  -H "X-Amz-Date: 20231115T123456Z" \
  -H "X-Amz-Target: BedrockRuntime.InvokeModel" \
  -d '{
  "anthropic_version": "bedrock-2023-05-31",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello, how are you?"
        }
      ]
    }
  ]
}'
```

```typescript {{title: 'Composable SDK'}}
import { BedrockDriver } from "@llumiverse/bedrock";
import { PromptRole } from "@llumiverse/core";

const driver = new BedrockDriver({
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
  },
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "anthropic.claude-v2",
});

console.log(response.result);
```
</CodeGroup>

## Hugging Face Inference Endpoint Driver

The Hugging Face Inference Endpoint driver allows you to interact with Hugging Face Inference Endpoints.

### Installation

```bash
npm install @llumiverse/huggingface_ie
```

### Usage

```typescript
import { HuggingFaceIEDriver } from "@llumiverse/huggingface_ie";

const driver = new HuggingFaceIEDriver({
  apiKey: "YOUR_HUGGING_FACE_API_KEY",
  endpoint_url: "YOUR_ENDPOINT_URL",
});
```

### Example

```typescript
import { HuggingFaceIEDriver } from "@llumiverse/huggingface_ie";
import { PromptRole } from "@llumiverse/core";

const driver = new HuggingFaceIEDriver({
  apiKey: "YOUR_HUGGING_FACE_API_KEY",
  endpoint_url: "YOUR_ENDPOINT_URL",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "YOUR_MODEL_ID",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  YOUR_ENDPOINT_URL \
  -H "Authorization: Bearer YOUR_HUGGING_FACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "inputs": "Hello, how are you?"
}'
```

```typescript {{title: 'Composable SDK'}}
import { HuggingFaceIEDriver } from "@llumiverse/huggingface_ie";
import { PromptRole } from "@llumiverse/core";

const driver = new HuggingFaceIEDriver({
  apiKey: "YOUR_HUGGING_FACE_API_KEY",
  endpoint_url: "YOUR_ENDPOINT_URL",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "YOUR_MODEL_ID",
});

console.log(response.result);
```
</CodeGroup>

## Replicate Driver

The Replicate driver allows you to interact with the Replicate API.

### Installation

```bash
npm install @llumiverse/replicate
```

### Usage

```typescript
import { ReplicateDriver } from "@llumiverse/replicate";

const driver = new ReplicateDriver({
  apiKey: "YOUR_REPLICATE_API_KEY",
});
```

### Example

```typescript
import { ReplicateDriver } from "@llumiverse/replicate";
import { PromptRole } from "@llumiverse/core";

const driver = new ReplicateDriver({
  apiKey: "YOUR_REPLICATE_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "meta/llama-2-70b-chat:2c1608e18606fad2812020dc5419873748113a2c5a7f909f2dd180f8a43ba753",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  https://api.replicate.com/v1/predictions \
  -H "Authorization: Token YOUR_REPLICATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "version": "2c1608e18606fad2812020dc5419873748113a2c5a7f909f2dd180f8a43ba753",
  "input": {
    "prompt": "Hello, how are you?"
  }
}'
```

```typescript {{title: 'Composable SDK'}}
import { ReplicateDriver } from "@llumiverse/replicate";
import { PromptRole } from "@llumiverse/core";

const driver = new ReplicateDriver({
  apiKey: "YOUR_REPLICATE_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "meta/llama-2-70b-chat:2c1608e18606fad2812020dc5419873748113a2c5a7f909f2dd180f8a43ba753",
});

console.log(response.result);
```
</CodeGroup>

## TogetherAI Driver

The TogetherAI driver allows you to interact with the TogetherAI API.

### Installation

```bash
npm install @llumiverse/togetherai
```

### Usage

```typescript
import { TogetherAIDriver } from "@llumiverse/togetherai";

const driver = new TogetherAIDriver({
  apiKey: "YOUR_TOGETHERAI_API_KEY",
});
```

### Example

```typescript
import { TogetherAIDriver } from "@llumiverse/togetherai";
import { PromptRole } from "@llumiverse/core";

const driver = new TogetherAIDriver({
  apiKey: "YOUR_TOGETHERAI_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "togethercomputer/llama-2-70b-chat",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  https://api.together.xyz/v1/completions \
  -H "Authorization: Bearer YOUR_TOGETHERAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "model": "togethercomputer/llama-2-70b-chat",
  "prompt": "Hello, how are you?"
}'
```

```typescript {{title: 'Composable SDK'}}
import { TogetherAIDriver } from "@llumiverse/togetherai";
import { PromptRole } from "@llumiverse/core";

const driver = new TogetherAIDriver({
  apiKey: "YOUR_TOGETHERAI_API_KEY",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "togethercomputer/llama-2-70b-chat",
});

console.log(response.result);
```
</CodeGroup>

## VertexAI Driver

The VertexAI driver allows you to interact with the Google Vertex AI API.

### Installation

```bash
npm install @llumiverse/vertexai
```

### Usage

```typescript
import { VertexAIDriver } from "@llumiverse/vertexai";

const driver = new VertexAIDriver({
  project: "YOUR_GOOGLE_CLOUD_PROJECT",
  region: "us-central1",
});
```

### Example

```typescript
import { VertexAIDriver } from "@llumiverse/vertexai";
import { PromptRole } from "@llumiverse/core";

const driver = new VertexAIDriver({
  project: "YOUR_GOOGLE_CLOUD_PROJECT",
  region: "us-central1",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "gemini-1.0-pro",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_GOOGLE_CLOUD_PROJECT/locations/us-central1/publishers/google/models/gemini-pro:predict \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "instances": [
    {
      "context": "",
      "examples": [],
      "messages": [
        {
          "author": "user",
          "content": "Hello, how are you?"
        }
      ]
    }
  ],
  "parameters": {
    "temperature": 0.2,
    "topK": 40,
    "topP": 0.9
  }
}'
```

```typescript {{title: 'Composable SDK'}}
import { VertexAIDriver } from "@llumiverse/vertexai";
import { PromptRole } from "@llumiverse/core";

const driver = new VertexAIDriver({
  project: "YOUR_GOOGLE_CLOUD_PROJECT",
  region: "us-central1",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "gemini-1.0-pro",
});

console.log(response.result);
```
</CodeGroup>

## Watsonx Driver

The Watsonx driver allows you to interact with the IBM Watsonx API.

### Installation

```bash
npm install @llumiverse/watsonx
```

### Usage

```typescript
import { WatsonxDriver } from "@llumiverse/watsonx";

const driver = new WatsonxDriver({
  apiKey: "YOUR_WATSONX_API_KEY",
  projectId: "YOUR_WATSONX_PROJECT_ID",
  endpointUrl: "YOUR_WATSONX_ENDPOINT_URL",
});
```

### Example

```typescript
import { WatsonxDriver } from "@llumiverse/watsonx";
import { PromptRole } from "@llumiverse/core";

const driver = new WatsonxDriver({
  apiKey: "YOUR_WATSONX_API_KEY",
  projectId: "YOUR_WATSONX_PROJECT_ID",
  endpointUrl: "YOUR_WATSONX_ENDPOINT_URL",
});

const segments = [
  {
    role: PromptRole.user,
    content: "Hello, how are you?",
  },
];

const response = await driver.execute(segments, {
  model: "YOUR_MODEL_ID",
});

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  YOUR_WATSONX_ENDPOINT_URL/ml/v1/text/generation?version

## Using the OpenAI Driver

The `OpenAIDriver` allows you to interact with OpenAI's powerful large language models directly from your llumiverse application. This driver supports both text completion and chat completion APIs, enabling you to build a wide range of applications.

### Installation

To use the OpenAI driver, you'll need to install the `@llumiverse/openai` package:

```bash
npm install @llumiverse/openai
```

### Configuration

Before using the OpenAI driver, you need to configure it with your OpenAI API key. You can obtain an API key from [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys).

```typescript
import { OpenAIDriver } from '@llumiverse/openai';

const driver = new OpenAIDriver({
  apiKey: 'YOUR_OPENAI_API_KEY',
});
```

### Executing Prompts

The OpenAI driver supports both text and chat completion APIs. You can choose the appropriate method based on your use case.

#### Text Completion

For text completion, you can use the `execute` method, providing an array of `PromptSegment` objects and `ExecutionOptions`.

```typescript
import { PromptRole } from '@llumiverse/core';

const response = await driver.execute(
  [
    {
      role: PromptRole.system,
      content: 'You are a helpful assistant.',
    },
    {
      role: PromptRole.user,
      content: 'Write a short story about a cat who goes on an adventure.',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
    max_tokens: 500,
    temperature: 0.7,
  }
);

console.log(response.result);
```

<CodeGroup title="Code Example">
```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Write a short story about a cat who goes on an adventure."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}'
```

```typescript {{title: 'Composable SDK'}}
import { PromptRole } from '@llumiverse/core';

const response = await driver.execute(
  [
    {
      role: PromptRole.system,
      content: 'You are a helpful assistant.',
    },
    {
      role: PromptRole.user,
      content: 'Write a short story about a cat who goes on an adventure.',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
    max_tokens: 500,
    temperature: 0.7,
  }
);

console.log(response.result);
```
</CodeGroup>

#### Chat Completion

For chat completion, you can use the same `execute` method, but the `messages` property in the prompt should follow the OpenAI chat completion format.

```typescript
const response = await driver.execute(
  [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
  }
);

console.log(response.result);
```

<CodeGroup title="Code Example">
```bash {{title: 'cURL'}}
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -d '{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ]
}'
```

```typescript {{title: 'Composable SDK'}}
import { PromptRole } from '@llumiverse/core';

const response = await driver.execute(
  [
    {
      role: PromptRole.system,
      content: 'You are a helpful assistant.',
    },
    {
      role: PromptRole.user,
      content: 'What is the capital of France?',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
  }
);

console.log(response.result);
```
</CodeGroup>

### Streaming Responses

The OpenAI driver also supports streaming responses using the `stream` method. This allows you to receive the model's output in real-time as it is generated.

```typescript
const stream = await driver.stream(
  [
    {
      role: PromptRole.user,
      content: 'Tell me a joke.',
    },
  ],
  {
    model: 'gpt-3.5-turbo',
  }
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

### Fine-tuning Models

The OpenAI driver allows you to fine-tune OpenAI models using your own data. This can improve the model's performance on specific tasks.

#### Preparing Training Data

To fine-tune a model, you need to provide training data in a JSONL format. Each line in the JSONL file should contain a JSON object representing a single training example. The format of the JSON object depends on the model you are fine-tuning.

#### Starting a Training Job

You can start a fine-tuning job using the `startTraining` method, providing a `DataSource` object representing your training data and `TrainingOptions`.

```typescript
import { DataSource } from '@llumiverse/core';

const dataset = new DataSource({
  // ... your data source implementation
});

const job = await driver.startTraining(dataset, {
  name: 'my-fine-tuned-model',
  model: 'gpt-3.5-turbo',
});

console.log(job.id);
```

#### Monitoring Training Progress

You can monitor the progress of a training job using the `getTrainingJob` method.

```typescript
const job = await driver.getTrainingJob(jobId);

console.log(job.status);
```

#### Cancelling a Training Job

You can cancel a training job using the `cancelTraining` method.

```typescript
await driver.cancelTraining(jobId);
```

### Listing Models

You can list the available OpenAI models using the `listModels` method.

```typescript
const models = await driver.listModels();

console.log(models);
```

### Listing Trainable Models

You can list the models that can be fine-tuned using the `listTrainableModels` method.

```typescript
const models = await driver.listTrainableModels();

console.log(models);
```

### Validating Connection

You can check if the driver is properly configured and can connect to the OpenAI API using the `validateConnection` method.

```typescript
const isValid = await driver.validateConnection();

console.log(isValid);
```

### Generating Embeddings

You can generate embeddings for a given text using the `generateEmbeddings` method.

```typescript
const result = await driver.generateEmbeddings({
  content: 'This is a sample text.',
});

console.log(result.values);
```

### Example Use Cases

Here are some examples of how you can use the OpenAI driver in your llumiverse applications:

- **Chatbots:** Build conversational chatbots that can understand and respond to user queries.
- **Text generation:** Generate creative content, such as stories, poems, and articles.
- **Code generation:** Generate code in various programming languages.
- **Question answering:** Answer questions based on a given context.
- **Summarization:** Summarize large amounts of text.
- **Translation:** Translate text between different languages.
- **Sentiment analysis:** Analyze the sentiment of a given text.

The OpenAI driver provides a powerful and flexible way to integrate OpenAI's LLMs into your applications, enabling you to build a wide range of innovative solutions.




## Bedrock Driver

The Bedrock driver allows you to interact with [Amazon Bedrock](https://aws.amazon.com/bedrock/) foundation models and custom models.

### Installation

```bash
npm install @llumiverse/bedrock
```

### Usage

To use the Bedrock driver, you need to provide the following options:

- `region`: The AWS region where Bedrock is available.
- `training_bucket`: The S3 bucket name to be used for training. It will be created if it doesn't already exist.
- `training_role_arn`: The IAM role ARN to be used for training.
- `credentials`: The AWS credentials to use to access Bedrock.

Here is an example of how to use the Bedrock driver:

<CodeGroup>
```typescript {{title: 'Composable SDK'}}
import { BedrockDriver } from '@llumiverse/bedrock';
import { PromptRole } from '@llumiverse/core';

const driver = new BedrockDriver({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
  },
});

const result = await driver.execute(
  [
    {
      role: PromptRole.user,
      content: 'What is the meaning of life?',
    },
  ],
  {
    model: 'anthropic.claude-v2',
  }
);

console.log(result.result);
```

```bash {{title: 'cURL'}}
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2 \
  -d '{
    "anthropic_version": "bedrock-2023-05-31",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What is the meaning of life?"
          }
        ]
      }
    ]
  }'
```
</CodeGroup>

### Supported Models

The Bedrock driver supports the following foundation models:

- `amazon.titan-text-express-v1`
- `amazon.titan-text-lite-v1`
- `anthropic.claude-instant-v1`
- `anthropic.claude-v1`
- `anthropic.claude-v2`
- `ai21.j2-grande-instruct`
- `ai21.j2-jumbo-instruct`
- `cohere.command-xlarge-nightly`
- `cohere.command-light-nightly`
- `meta.llama2-13b-chat-v1`
- `meta.llama2-70b-chat-v1`
- `mistral.mixtral-8x7b-instruct-v0.1`

It also supports custom models that have been created using the Bedrock console or API.

### Training

The Bedrock driver allows you to fine-tune foundation models using your own data. To start a training job, you can use the `startTraining` method.

Here is an example of how to start a training job:

```typescript
const trainingJob = await driver.startTraining(
  {
    name: 'my-training-data.jsonl',
    getStream: () => fetch('https://example.com/my-training-data.jsonl').then(res => res.body!),
    getURL: () => Promise.resolve('https://example.com/my-training-data.jsonl'),
  },
  {
    name: 'my-custom-model',
    model: 'anthropic.claude-v2',
  }
);

console.log(trainingJob.id);
```

The `startTraining` method returns a `TrainingJob` object that you can use to monitor the progress of the job. You can use the `getTrainingJob` method to retrieve the status of a training job.

```typescript
const trainingJob = await driver.getTrainingJob(trainingJobId);

console.log(trainingJob.status);
```

You can also cancel a training job using the `cancelTraining` method.

```typescript
await driver.cancelTraining(trainingJobId);
```

### Embeddings

The Bedrock driver allows you to generate embeddings for text using the `generateEmbeddings` method.

Here is an example of how to generate embeddings:

```typescript
const embeddings = await driver.generateEmbeddings({
  content: 'This is a sentence.',
  model: 'amazon.titan-embed-text-v1',
});

console.log(embeddings.values);
```

The `generateEmbeddings` method returns an `EmbeddingsResult` object that contains the embedding vectors and the model used to generate them.

### Example Use Cases

Here are some examples of how you can use the Bedrock driver:

- **Chatbot:** You can use the Bedrock driver to build a chatbot that can answer questions, generate text, and translate languages.
- **Text summarization:** You can use the Bedrock driver to summarize large amounts of text into a concise summary.
- **Code generation:** You can use the Bedrock driver to generate code in different programming languages.
- **Image generation:** You can use the Bedrock driver to generate images from text prompts.

### Limitations

The Bedrock driver has the following limitations:

- It is only available in AWS regions where Bedrock is supported.
- It does not support all Bedrock features, such as prompt engineering and model customization.



## Hugging Face Inference Endpoint Driver

This driver allows you to interact with [Hugging Face Inference Endpoints](https://huggingface.co/docs/inference-endpoints/index).

### Installation

```bash
npm install @llumiverse/huggingface_ie
```

### Usage

The Hugging Face Inference Endpoint driver requires an API key and the endpoint URL. You can find your API key on your [Hugging Face account page](https://huggingface.co/settings/tokens).

```typescript
import { HuggingFaceIEDriver } from '@llumiverse/huggingface_ie';

const driver = new HuggingFaceIEDriver({
  apiKey: 'YOUR_API_KEY',
  endpoint_url: 'YOUR_ENDPOINT_URL',
});
```

### Example

Here is a simple example of how to use the Hugging Face Inference Endpoint driver to execute a prompt:

<CodeGroup>
```typescript {{title: 'Composable SDK'}}
import { HuggingFaceIEDriver } from '@llumiverse/huggingface_ie';

const driver = new HuggingFaceIEDriver({
  apiKey: 'YOUR_API_KEY',
  endpoint_url: 'YOUR_ENDPOINT_URL',
});

const result = await driver.execute(
  [
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ],
  {
    model: 'YOUR_MODEL_ID',
  }
);

console.log(result.result); // Paris
```

```bash {{title: 'cURL'}}
curl \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  YOUR_ENDPOINT_URL/YOUR_MODEL_ID \
  -d '{
    "inputs": "What is the capital of France?"
  }'
```
</CodeGroup>

### Listing Models

You can list all the models available on your Hugging Face Inference Endpoint using the `listModels` method:

```typescript
const models = await driver.listModels();
console.log(models);
```

This will return an array of `AIModel` objects, each containing the following properties:

```json
[
  {
    "id": "gpt2", // The model ID
    "name": "gpt2 [gpt2:text-generation]", // The model name
    "provider": "huggingface_ie", // The provider name
    "tags": [
      "text-generation"
    ], // The model tags
    "status": "available" // The model status
  }
]
```

### Validating the Connection

You can check if the connection to your Hugging Face Inference Endpoint is valid using the `validateConnection` method:

```typescript
const isValid = await driver.validateConnection();
console.log(isValid); // true
```




## Replicate Driver

The Replicate driver allows you to execute prompts and stream responses from models hosted on [Replicate](https://replicate.com/). It also supports fine-tuning models.

### Installation

```bash
npm install @llumiverse/replicate
```

### Usage

To use the Replicate driver, you will need an API key from Replicate. You can find your API key on your [Replicate account page](https://replicate.com/account).

```typescript
import { ReplicateDriver } from "@llumiverse/replicate";

const driver = new ReplicateDriver({
  apiKey: "YOUR_REPLICATE_API_KEY",
});
```

### Execute a prompt

```typescript
const response = await driver.execute(
  [
    {
      role: "user",
      content: "What is the meaning of life?",
    },
  ],
  {
    model: "meta/llama-2-7b-chat:2c1608e18606fad2812020dc541930f2d821b12ff53a5012a8110f3a73839f56",
  }
);

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl https://api.replicate.com/v1/predictions \
  -H "Authorization: Token YOUR_REPLICATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "version": "2c1608e18606fad2812020dc541930f2d821b12ff53a5012a8110f3a73839f56",
        "input": {
          "prompt": "What is the meaning of life?"
        }
      }'
```

```typescript {{title: 'Composable SDK'}}
import { ReplicateDriver } from "@llumiverse/replicate";

const driver = new ReplicateDriver({
  apiKey: "YOUR_REPLICATE_API_KEY",
});

const response = await driver.execute(
  [
    {
      role: "user",
      content: "What is the meaning of life?",
    },
  ],
  {
    model: "meta/llama-2-7b-chat:2c1608e18606fad2812020dc541930f2d821b12ff53a5012a8110f3a73839f56",
  }
);

console.log(response.result);
```
</CodeGroup>

### Stream a response

```typescript
for await (const chunk of driver.stream(
  [
    {
      role: "user",
      content: "Tell me a story about a robot who falls in love with a human.",
    },
  ],
  {
    model: "meta/llama-2-7b-chat:2c1608e18606fad2812020dc541930f2d821b12ff53a5012a8110f3a73839f56",
  }
)) {
  console.log(chunk);
}
```

### Fine-tune a model

```typescript
const trainingJob = await driver.startTraining(
  // The training dataset
  {
    name: "my-training-data.jsonl",
    getURL: async () =>
      "https://example.com/my-training-data.jsonl",
    getStream: async () => {
      throw new Error("Method not implemented.");
    },
  },
  {
    // The name of the new model
    name: "my-username/my-fine-tuned-model",
    // The model to fine-tune
    model: "meta/llama-2-7b-chat:2c1608e18606fad2812020dc541930f2d821b12ff53a5012a8110f3a73839f56",
  }
);

console.log(trainingJob);
```

### List models

```typescript
const models = await driver.listModels();

console.log(models);
```

### List trainable models

```typescript
const trainableModels = await driver.listTrainableModels();

console.log(trainableModels);
```

### Validate connection

```typescript
const isValid = await driver.validateConnection();

console.log(isValid);
```

### Example use cases

Here are some examples of how you can use the Replicate driver:

* **Chatbot:** Create a chatbot that can answer questions, generate text, and translate languages.
* **Code generation:** Generate code in different programming languages.
* **Image generation:** Generate images from text prompts.
* **Text summarization:** Summarize large amounts of text.

### Note

The Replicate driver only supports models that are available on Replicate. You can find a list of available models on the [Replicate website](https://replicate.com/explore).

### Error Handling

The Replicate driver will throw an error if there is a problem connecting to Replicate or if the requested model is not available. You can catch these errors and handle them appropriately.

### Logging

The Replicate driver uses the `@llumiverse/core` logger. You can configure the logger to output debug information or to write logs to a file.




## TogetherAI Driver

The TogetherAI driver allows you to interact with the TogetherAI platform.

### Installation

```bash
npm install @llumiverse/togetherai
```

### Usage

To use the TogetherAI driver, you need to create an instance of the `TogetherAIDriver` class. The constructor takes an object with the following options:

- `apiKey`: Your TogetherAI API key.

```typescript
import { TogetherAIDriver } from '@llumiverse/togetherai';

const driver = new TogetherAIDriver({
  apiKey: 'YOUR_API_KEY',
});
```

### Example

Here is an example of how to use the TogetherAI driver to execute a prompt:

```typescript
import { PromptRole, TogetherAIDriver } from '@llumiverse/togetherai';

const driver = new TogetherAIDriver({
  apiKey: 'YOUR_API_KEY',
});

const prompt = [
  {
    role: PromptRole.user,
    content: 'What is the meaning of life?',
  },
];

const result = await driver.execute(prompt, {
  model: 'togethercomputer/llama-2-70b-chat',
});

console.log(result.result);
```

<CodeGroup title="Code Example">
```bash {{title: 'cURL'}}
curl -X POST \
  'https://api.together.xyz/v1/completions' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "togethercomputer/llama-2-70b-chat",
  "prompt": "What is the meaning of life?",
  "max_tokens": 2048,
  "temperature": 0.7,
  "stop": [
    "</s>",
    "[/INST]"
  ]
}'
```

```typescript {{title: 'Composable SDK'}}
import { PromptRole, TogetherAIDriver } from '@llumiverse/togetherai';

const driver = new TogetherAIDriver({
  apiKey: 'YOUR_API_KEY',
});

const prompt = [
  {
    role: PromptRole.user,
    content: 'What is the meaning of life?',
  },
];

const result = await driver.execute(prompt, {
  model: 'togethercomputer/llama-2-70b-chat',
});

console.log(result.result);
```
</CodeGroup>

### Streaming

The TogetherAI driver also supports streaming responses. To stream a response, use the `stream` method instead of the `execute` method.

```typescript
import { PromptRole, TogetherAIDriver } from '@llumiverse/togetherai';

const driver = new TogetherAIDriver({
  apiKey: 'YOUR_API_KEY',
});

const prompt = [
  {
    role: PromptRole.user,
    content: 'Tell me a story about a cat.',
  },
];

const stream = await driver.stream(prompt, {
  model: 'togethercomputer/llama-2-70b-chat',
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

### JSON Schema Validation

You can use the `result_schema` option to specify a JSON schema for the response. The driver will validate the response against the schema and throw an error if the response is invalid.

```typescript
import { PromptRole, TogetherAIDriver } from '@llumiverse/togetherai';

const driver = new TogetherAIDriver({
  apiKey: 'YOUR_API_KEY',
});

const prompt = [
  {
    role: PromptRole.user,
    content: 'Give me a JSON object with the name and age of a person.',
  },
];

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'integer',
    },
  },
  required: ['name', 'age'],
};

const result = await driver.execute(prompt, {
  model: 'togethercomputer/llama-2-70b-chat',
  result_schema: schema,
});

console.log(result.result);
```

If the response is invalid, the `result.error` property will contain an error object.

```json
{
  "code": "validation_error",
  "message": "Result cannot be validated!",
  // ...
}
```




## Using the VertexAI Driver

The `VertexAIDriver` allows you to interact with Google's Vertex AI platform, providing access to a wide range of powerful large language models (LLMs) for tasks such as text generation, code completion, and chat.

### Installation

To use the VertexAI driver, you'll need to install the `@llumiverse/drivers` package:

```bash
npm install @llumiverse/drivers
```

### Configuration

Before using the `VertexAIDriver`, you need to configure it with your Google Cloud project ID and region:

```typescript
import { VertexAIDriver } from '@llumiverse/drivers';

const driver = new VertexAIDriver({
  project: 'your-google-cloud-project-id',
  region: 'your-google-cloud-region', // e.g., 'us-central1'
});
```

### Usage

#### Listing Available Models

You can list the available models using the `listModels` method:

```typescript
const models = await driver.listModels();
console.log(models);
```

This will print an array of `AIModel` objects, each representing a model available on Vertex AI.

#### Executing a Prompt

To execute a prompt, you first need to define it as an array of `PromptSegment` objects. Each segment represents a part of the conversation, with a specific role (system, user, assistant) and its content.

Here's an example of a simple prompt:

```typescript
import { PromptRole } from '@llumiverse/core';

const segments = [
  {
    role: PromptRole.user,
    content: 'What is the capital of France?',
  },
];
```

Then, you can use the `execute` method to send the prompt to the chosen model and retrieve the response:

```typescript
const response = await driver.execute(segments, {
  model: 'gemini-1.0-pro', // Choose the desired model
});

console.log(response.result); // This will print the model's answer
```

#### Streaming a Response

For models that support streaming, you can use the `stream` method to receive the response in real-time as it is generated:

```typescript
const stream = await driver.stream(segments, {
  model: 'gemini-1.0-pro', // Choose a streaming-capable model
});

for await (const chunk of stream) {
  console.log(chunk); // Print each chunk of the response as it arrives
}
```

#### Generating Embeddings

Vertex AI also offers models for generating embeddings, which are numerical representations of text that can be used for tasks like similarity search and clustering.

Here's an example of how to generate embeddings for a given text:

```typescript
const embeddings = await driver.generateEmbeddings({
  content: 'This is a sample text for embedding generation.',
  model: 'textembedding-gecko-multilingual', // Choose the embedding model
});

console.log(embeddings.values); // This will print the embedding vector
```

### Supported Models

The `VertexAIDriver` supports a variety of models, including:

- **Gemini Pro** (text and multimodal)
- **PaLM 2** (text and chat)
- **Codey** (code completion, generation, and chat)
- **Gecko** (text embeddings)

For a complete list of supported models and their capabilities, refer to the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/models).

### Error Handling

The `VertexAIDriver` may throw errors if there are issues with the connection, authentication, or the request itself. Make sure to handle these errors appropriately in your application.

### Examples

For more comprehensive examples of using the `VertexAIDriver`, please refer to the [llumiverse examples repository](https://github.com/llumiverse/llumiverse/tree/main/examples).








## Groq Driver

The Groq driver allows you to interact with the Groq API.

### Initializing the driver

```typescript
import { GroqDriver } from "@llumiverse/drivers";

const driver = new GroqDriver({
  apiKey: "YOUR_GROQ_API_KEY",
  endpoint_url: "https://api.groq.com", // optional, defaults to https://api.groq.com
});
```

### Executing a prompt

```typescript
const response = await driver.execute(
  [
    { role: "user", content: "What is the meaning of life?" },
  ],
  { model: "groq/bison-6b" }
);

console.log(response.result);
```

<CodeGroup>
```bash {{title: 'cURL'}}
curl https://api.groq.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "model": "groq/bison-6b",
  "messages": [
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
}'
```

```typescript {{title: 'Composable SDK'}}
import { GroqDriver } from "@llumiverse/drivers";

const driver = new GroqDriver({
  apiKey: "YOUR_GROQ_API_KEY",
});

const response = await driver.execute(
  [
    { role: "user", content: "What is the meaning of life?" },
  ],
  { model: "groq/bison-6b" }
);

console.log(response.result);
```
</CodeGroup>

### Streaming a prompt

```typescript
const stream = await driver.stream(
  [
    { role: "user", content: "Tell me a story about a robot." },
  ],
  { model: "groq/bison-6b" }
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

### Listing available models

```typescript
const models = await driver.listModels();

console.log(models);
```

### Generating embeddings

The Groq driver does not currently support generating embeddings.

### Error handling

The Groq driver will throw an error if the Groq API returns an error. You can catch these errors using a try/catch block.

```typescript
try {
  const response = await driver.execute(
    [
      { role: "user", content: "What is the meaning of life?" },
    ],
    { model: "groq/bison-6b" }
  );

  console.log(response.result);
} catch (error) {
  console.error(error);
}
```

### Example use cases

Here are some examples of how you can use the Groq driver:

* **Chatbot:** You can use the Groq driver to build a chatbot that can answer questions, generate text, and translate languages.
* **Text summarization:** You can use the Groq driver to summarize long pieces of text.
* **Code generation:** You can use the Groq driver to generate code in different programming languages.

### Limitations

The Groq driver currently has the following limitations:

* **Streaming JSON responses:** The Groq driver does not currently support streaming JSON responses.
* **Embeddings:** The Groq driver does not currently support generating embeddings.



## MistralAI Driver

The MistralAI Driver allows you to interact with the [MistralAI](https://www.mistral.ai/) large language models.

### Installation

```bash
npm install @llumiverse/mistral
```

### Usage

The MistralAI driver requires an API key and optionally an endpoint URL. If no endpoint URL is specified, the default MistralAI endpoint will be used.

```typescript
import { MistralAIDriver } from "@llumiverse/mistral";

const driver = new MistralAIDriver({
  apiKey: "YOUR_MISTRAL_API_KEY",
  endpoint_url: "https://api.mistral.ai" // optional
});
```

### Example

Here is an example of how to use the MistralAI driver to execute a prompt:

<CodeGroup>
```bash {{title: 'cURL'}}
curl -X POST \
  https://api.mistral.ai/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_MISTRAL_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "mistral-tiny",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 256
}'
```

```typescript {{title: 'Composable SDK'}}
import { MistralAIDriver } from "@llumiverse/mistral";
import { PromptRole } from "@llumiverse/core";

const driver = new MistralAIDriver({
  apiKey: "YOUR_MISTRAL_API_KEY",
});

const response = await driver.execute(
  [
    {
      role: PromptRole.user,
      content: "Hello, how are you?",
    },
  ],
  {
    model: "mistral-tiny",
    temperature: 0.7,
    max_tokens: 256,
  }
);

console.log(response.result);
```
</CodeGroup>

### Streaming

The MistralAI driver supports streaming responses. To stream the response, use the `stream` method instead of the `execute` method.

```typescript
import { MistralAIDriver } from "@llumiverse/mistral";
import { PromptRole } from "@llumiverse/core";

const driver = new MistralAIDriver({
  apiKey: "YOUR_MISTRAL_API_KEY",
});

const stream = await driver.stream(
  [
    {
      role: PromptRole.user,
      content: "Tell me a story about a cat.",
    },
  ],
  {
    model: "mistral-tiny",
  }
);

for await (const chunk of stream) {
  console.log(chunk);
}
```

### Embeddings

The MistralAI driver supports generating embeddings. To generate embeddings, use the `generateEmbeddings` method.

```typescript
import { MistralAIDriver } from "@llumiverse/mistral";

const driver = new MistralAIDriver({
  apiKey: "YOUR_MISTRAL_API_KEY",
});

const result = await driver.generateEmbeddings({
  content: "This is a sentence.",
  model: "mistral-embed",
});

console.log(result.values);
```

### API

#### `new MistralAIDriver(options: MistralAIDriverOptions)`

Creates a new instance of the MistralAI driver.

**Parameters:**

* `options: MistralAIDriverOptions` - The options for the driver.

**Options:**

* `apiKey: string` - The API key for MistralAI.
* `endpoint_url: string` - The endpoint URL for MistralAI. Defaults to `https://api.mistral.ai`.

#### `execute(segments: PromptSegment[], options: ExecutionOptions): Promise<ExecutionResponse<any>>`

Executes a prompt and returns the response.

**Parameters:**

* `segments: PromptSegment[]` - The prompt segments.
* `options: ExecutionOptions` - The execution options.

**Options:**

* `model: string` - The model to use.
* `temperature: number` - The temperature to use.
* `max_tokens: number` - The maximum number of tokens to generate.
* `result_schema: JSONSchema4` - The JSON schema to validate the response against.

#### `stream(segments: PromptSegment[], options: ExecutionOptions): Promise<AsyncIterable<string>>`

Executes a prompt and streams the response.

**Parameters:**

* `segments: PromptSegment[]` - The prompt segments.
* `options: ExecutionOptions` - The execution options.

**Options:**

* `model: string` - The model to use.
* `temperature: number` - The temperature to use.
* `max_tokens: number` - The maximum number of tokens to generate.
* `result_schema: JSONSchema4` - The JSON schema to validate the response against.

#### `listModels(): Promise<AIModel[]>`

Lists the available models.

#### `validateConnection(): Promise<boolean>`

Validates the connection to MistralAI.

#### `generateEmbeddings(options: EmbeddingsOptions): Promise<EmbeddingsResult>`

Generates embeddings for a given text.

**Parameters:**

* `options: EmbeddingsOptions` - The options for the embeddings generation.

**Options:**

* `content: string` - The content to generate the embeddings for.
* `model: string` - The model to use to generate the embeddings. Defaults to `mistral-embed`.




## Test Driver

The test driver is a mock driver that can be used to test the llumiverse library. It provides two models:

- `execution-error`: This model will throw an error when executed.
- `validation-error`: This model will return a result that will fail validation.

### Usage

The test driver can be used like any other driver. For example, to execute a prompt using the `execution-error` model:

<CodeGroup>

```typescript {{title: 'Composable SDK'}}
import { TestDriver, TestDriverModels, PromptRole } from '@llumiverse/drivers';

const driver = new TestDriver();

const prompt = [
  {
    role: PromptRole.user,
    content: 'This is a test prompt.',
  },
];

driver.execute(prompt, { model: TestDriverModels.executionError })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.error(error);
  });
```

```bash {{title: 'cURL'}}
curl -X POST \
  https://api.example.com/v1/completions \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "execution-error",
  "prompt": [
    {
      "role": "user",
      "content": "This is a test prompt."
    }
  ]
}'
```

</CodeGroup>

This will throw an error with the message "Testing stream completion error.".

To execute a prompt using the `validation-error` model:

<CodeGroup>

```typescript {{title: 'Composable SDK'}}
import { TestDriver, TestDriverModels, PromptRole } from '@llumiverse/drivers';

const driver = new TestDriver();

const prompt = [
  {
    role: PromptRole.user,
    content: 'This is a test prompt.',
  },
];

driver.execute(prompt, { model: TestDriverModels.validationError, result_schema: { type: 'string' } })
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.error(error);
  });
```

```bash {{title: 'cURL'}}
curl -X POST \
  https://api.example.com/v1/completions \
  -H 'Content-Type: application/json' \
  -d '{
  "model": "validation-error",
  "prompt": [
    {
      "role": "user",
      "content": "This is a test prompt."
    }
  ],
  "result_schema": {
    "type": "string"
  }
}'
```

</CodeGroup>

This will return a response with the following error:

```json
{
  "code": "validation_error",
  "message": "Result cannot be validated!"
}
```

### Example Use Cases

The test driver can be used to test the following:

- Error handling: You can use the `execution-error` model to test how your application handles errors from the llumiverse library.
- Result validation: You can use the `validation-error` model to test how your application handles results that fail validation.
- Prompt formatting: You can use the test driver to test different prompt formatting options.

### Limitations

The test driver is a mock driver and does not actually execute any prompts. It is only intended for testing purposes.


