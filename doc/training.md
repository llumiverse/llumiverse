export const metadata = {
    title: 'Training',
    model: 'gemini-1.5-pro',
    generated_at: '2024-08-21T17:46:30.322Z',
    }
    


    ## Training

This section explains how to use the llumiverse library to fine-tune LLMs.

### Preparing Training Data

#### Overview

Fine-tuning a large language model (LLM) involves training it on a specific dataset to improve its performance on a particular task or domain. This process requires preparing the training data in a format that the LLM can understand.

#### Data Format

The format and structure of the training data required for fine-tuning vary depending on the LLM provider. Generally, the data should consist of pairs of inputs and desired outputs. For example, if you're fine-tuning a model for text summarization, the input would be a long text passage, and the output would be a concise summary of that passage.

#### Supported Formats

The llumiverse library supports various data formats for training, including:

- **JSONL (JSON Lines):** Each line in the file is a JSON object representing a single training example.
- **CSV (Comma-Separated Values):** The first row contains the column headers, and each subsequent row represents a training example.
- **Text files:** Each line in the file represents a single training example.

#### Data Conversion

The llumiverse library provides utilities to convert your data into the appropriate format for different LLM providers. You can use these utilities to:

- Convert between different data formats (e.g., from CSV to JSONL).
- Split your data into training, validation, and test sets.
- Preprocess the data (e.g., tokenization, normalization).

#### Example

```typescript
import { DataSource } from "@llumiverse/core";

// Define a data source that reads data from a CSV file
const dataSource = new DataSource({
  name: "my-training-data.csv",
  getStream: async () => {
    // Read the CSV file and return a stream of data
    const response = await fetch("my-training-data.csv");
    return response.body;
  },
});

// Convert the data source to JSONL format
const jsonlDataSource = await dataSource.convertToJSONL();

// Split the data into training and validation sets
const { trainingSet, validationSet } = await jsonlDataSource.split(0.8);
```

### Training Options

#### Overview

When fine-tuning an LLM, you can configure various training options that control the training process. These options affect the model's performance, training time, and resource consumption.

#### Common Options

The llumiverse library provides a consistent interface for configuring training options across different LLM providers. Some common options include:

- **Learning rate:** Controls the step size during optimization.
- **Batch size:** The number of training examples processed in each iteration.
- **Epochs:** The number of times the entire training dataset is passed through the model.
- **Early stopping:** Stops training when the model's performance on the validation set stops improving.

#### Provider-Specific Options

In addition to the common options, each LLM provider may have specific training options. The llumiverse library allows you to configure these options through a provider-specific configuration object.

#### Example

```typescript
import { TrainingOptions } from "@llumiverse/core";

// Define the training options
const trainingOptions: TrainingOptions = {
  name: "my-fine-tuned-model",
  model: "gpt-3.5-turbo",
  params: {
    learning_rate: 0.001,
    batch_size: 32,
    epochs: 10,
  },
};
```

### Monitoring Training

#### Overview

During the fine-tuning process, it's essential to monitor the model's progress and performance. The llumiverse library provides tools to track the training job's status, view logs, and retrieve the fine-tuned model.

#### Tracking Progress

You can use the `getTrainingJob` method to retrieve information about the training job, including its status, progress, and estimated completion time.

#### Viewing Logs

The llumiverse library allows you to access the training logs, which contain detailed information about the training process, such as loss values, metrics, and any errors encountered.

#### Retrieving the Fine-Tuned Model

Once the training job is complete, you can retrieve the fine-tuned model and use it for inference. The llumiverse library provides methods to download the model or access it directly from the LLM provider's platform.

#### Example

```typescript
import { TrainingJobStatus } from "@llumiverse/core";

// Start the training job
const trainingJob = await driver.startTraining(trainingSet, trainingOptions);

// Monitor the training job's status
let jobStatus = trainingJob.status;
while (jobStatus !== TrainingJobStatus.succeeded && jobStatus !== TrainingJobStatus.failed) {
  // Wait for a while before checking the status again
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get the updated training job
  const updatedJob = await driver.getTrainingJob(trainingJob.id);
  jobStatus = updatedJob.status;

  // Print the job's status and details
  console.log(`Training job status: ${jobStatus}`);
  console.log(`Details: ${updatedJob.details}`);
}

// Retrieve the fine-tuned model
if (jobStatus === TrainingJobStatus.succeeded) {
  const fineTunedModel = await driver.getFineTunedModel(trainingJob.id);
}
```

## Preparing Training Data

This section explains how to prepare the training data for fine-tuning LLMs using the llumiverse library. 

The format and structure of the training data required by different LLM providers vary. The llumiverse library provides a unified interface to prepare your data into the appropriate format for each provider.

The `DataSource` interface represents a source of training data. It can be a local file, a remote URL, or any other source that can be represented as a stream of bytes.

```typescript
export interface DataSource {
    name: string;
    mime_type?: string;
    getStream(): Promise<ReadableStream<Uint8Array | string>>;
    getURL(): Promise<string>;
}
```

### Example: Training data from a local file

```typescript
import { DataSource } from '@llumiverse/core';
import fs from 'fs';

class LocalFileDataSource implements DataSource {
    constructor(public name: string, public filePath: string, public mime_type?: string) { }

    async getStream(): Promise<ReadableStream<Uint8Array>> {
        const stream = fs.createReadStream(this.filePath);
        return stream as any;
    }

    async getURL(): Promise<string> {
        throw new Error('Local file cannot be represented as a URL');
    }
}

const dataset = new LocalFileDataSource('my-training-data.jsonl', './data/my-training-data.jsonl', 'application/jsonlines');
```

### Example: Training data from a remote URL

```typescript
import { DataSource } from '@llumiverse/core';
import fetch from 'node-fetch';

class RemoteURLDataSource implements DataSource {
    constructor(public name: string, public url: string, public mime_type?: string) { }

    async getStream(): Promise<ReadableStream<Uint8Array>> {
        const response = await fetch(this.url);
        return response.body as any;
    }

    async getURL(): Promise<string> {
        return this.url;
    }
}

const dataset = new RemoteURLDataSource('my-training-data.jsonl', 'https://example.com/data/my-training-data.jsonl', 'application/jsonlines');
```

Once you have created a `DataSource` object, you can pass it to the `startTraining` method of the driver to start a fine-tuning job.

```typescript
const driver = new OpenAIDriver({ apiKey: 'YOUR_API_KEY' });
const job = await driver.startTraining(dataset, {
    name: 'my-fine-tuned-model',
    model: 'gpt-3.5-turbo',
    params: {
        // training parameters
    }
});
```

The `startTraining` method returns a `TrainingJob` object that you can use to monitor the progress of the fine-tuning job.

**Note:** The specific format of the training data required by each LLM provider is documented in the provider's documentation. Please refer to the provider's documentation for more information.




## Training Options

This interface defines the options for starting a training job.

```typescript
export interface TrainingOptions {
    name: string; // the new model name
    model: string; // the model to train
    params?: JSONObject; // the training parameters
}
```

### Properties

- **`name`**: The name of the new fine-tuned model. This is required and must be unique.
- **`model`**: The ID of the base model to fine-tune. This is required and must be a valid model ID for the target provider.
- **`params`**: An optional object containing the hyperparameters for the fine-tuning process. The supported parameters depend on the target provider and the base model. See the provider's documentation for more details.

### Example

```json
{
  "name": "my-fine-tuned-model",
  "model": "openai/gpt-3.5-turbo",
  "params": {
    "learning_rate": 0.001,
    "batch_size": 16,
    "epochs": 3
  }
}
```




## Monitoring Training

You can monitor the progress and status of a training job using the `getTrainingJob` method of the driver.

This method takes the training job ID as an argument and returns a `TrainingJob` object. The `TrainingJob` object contains information about the job, including its status, details, and the name of the fine-tuned model that is created.

The status of the training job depends on the implementation of the driver. For example, the OpenAI driver returns a status of "running", "succeeded", "failed", or "cancelled". The Bedrock driver returns a status of "InProgress", "Completed", "Failed", "Stopping", or "Stopped".

The details field of the `TrainingJob` object provides more information about the status of the job. For example, if the job failed, the details field might contain an error message.

The model field of the `TrainingJob` object contains the name of the fine-tuned model that is created. This field is only set if the job has succeeded.

### Usage

```typescript
const job = await driver.getTrainingJob(jobId);

console.log(job.status); // "running", "succeeded", "failed", or "cancelled"
console.log(job.details); // more information about the status of the job
console.log(job.model); // the name of the fine-tuned model that is created
```

### Example

The following example shows how to monitor the progress of a training job using the OpenAI driver:

```typescript
import { OpenAIDriver } from '@llumiverse/openai';

const driver = new OpenAIDriver({
  apiKey: 'YOUR_API_KEY',
});

const jobId = 'ft-your-job-id';

// Monitor the progress of the training job every 5 seconds.
const intervalId = setInterval(async () => {
  const job = await driver.getTrainingJob(jobId);

  console.log(`Training job status: ${job.status}`);

  if (job.status === 'succeeded') {
    console.log(`Fine-tuned model name: ${job.model}`);
    clearInterval(intervalId);
  } else if (job.status === 'failed') {
    console.error(`Training job failed: ${job.details}`);
    clearInterval(intervalId);
  }
}, 5000);
```

This example will print the status of the training job to the console every 5 seconds. If the job succeeds, the example will print the name of the fine-tuned model to the console and then stop monitoring the job. If the job fails, the example will print an error message to the console and then stop monitoring the job.


