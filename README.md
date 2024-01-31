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

New capabilities and platform can easily be added by creating a new driver for the platform.


## Requirements

* node v16+, or bun 1.0+

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



## Contributing

Contributions are welcome!
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.


## License

Llumivers is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Feel free to use it accordingly.
