import { AbstractDriver } from "./Driver.js";
import { ExecutionResponse, CompletionStream, DriverOptions, ExecutionOptions, PromptSegment } from "./types.js";

export class DefaultCompletionStream<PromptT = any> implements CompletionStream<PromptT> {

    chunks: string[];
    prompt: PromptT;
    completion: ExecutionResponse<PromptT> | undefined;

    constructor(public driver: AbstractDriver<DriverOptions, PromptT>,
        segments: PromptSegment[],
        public options: ExecutionOptions) {
        this.driver = driver;
        this.prompt = this.driver.createPrompt(segments, options);
        this.chunks = [];
    }

    async *[Symbol.asyncIterator]() {
        // reset state
        this.completion = undefined;
        if (this.chunks.length > 0) {
            this.chunks = [];
        }
        const chunks = this.chunks;

        this.driver.logger.debug(
            `[${this.driver.provider}] Streaming Execution of ${this.options.model} with prompt`, this.prompt,
        );

        const start = Date.now();
        const stream = await this.driver.requestCompletionStream(this.prompt, this.options);

        for await (const chunk of stream) {
            if (chunk) {
                chunks.push(chunk);
                yield chunk;
            }
        }

        const content = chunks.join('');
        const promptTokens = typeof this.prompt === 'string' ? this.prompt.length : JSON.stringify(this.prompt).length;
        const resultTokens = content.length; //TODO use chunks.length ?

        this.completion = {
            result: content,
            prompt: this.prompt,
            execution_time: Date.now() - start,
            token_usage: {
                prompt: promptTokens,
                result: resultTokens,
                total: resultTokens + promptTokens,
            }
        }

        this.driver.validateResult(this.completion, this.options);
    }

}

export class FallbackCompletionStream<PromptT = any> implements CompletionStream<PromptT> {

    prompt: PromptT;
    completion: ExecutionResponse<PromptT> | undefined;

    constructor(public driver: AbstractDriver<DriverOptions, PromptT>,
        segments: PromptSegment[],
        public options: ExecutionOptions) {
        this.driver = driver;
        this.prompt = this.driver.createPrompt(segments, options);
    }

    async *[Symbol.asyncIterator]() {
        // reset state
        this.completion = undefined;
        this.driver.logger.debug(
            `[${this.driver.provider}] Streaming is not supported, falling back to blocking execution`
        );
        const completion = await this.driver._execute(this.prompt, this.options);
        const content = typeof completion.result === 'string' ? completion.result : JSON.stringify(completion.result);
        yield content;

        this.completion = completion;
    }
}

