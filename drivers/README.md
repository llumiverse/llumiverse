# Llumiverse - Universal LLM Connectors for Node.js

## Drivers

This module provide driver implementation for all supported LLM platforms

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

See [@llumiverse/core](https://github.com/llumiverse/llumiverse/blob/main/README.md) for the usage

## Contributing

Contributions are welcome!
Please see [CONTRIBUTING.md](https://github.com/llumiverse/llumiverse/blob/main/CONTRIBUTING.md) for more details.


## License

Llumivers is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). Feel free to use it accordingly.
