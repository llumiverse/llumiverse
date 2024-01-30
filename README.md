# @llumiverse v0.8.0

LLumiverse provides an abstraction over LLM endpoints focusing on execution prompt completions, training new models and browsing existing models.

The following target LLM providers are supported in the current version:

* OpenAI
* Replicate
* Bedrock
* HuggingFace
* Google VertexAI

##Requirements
* node v16 or greater 

##Instalation 

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

