import { AbstractDriver } from "./Driver.js";
import { CompletionStream, DriverOptions, ExecutionOptions, ExecutionResponse } from "./types.js";

export class DefaultCompletionStream<PromptT = any> implements CompletionStream<PromptT> {

    chunks: string[];
    completion: ExecutionResponse<PromptT> | undefined;

    constructor(public driver: AbstractDriver<DriverOptions, PromptT>,
        public prompt: PromptT,
        public options: ExecutionOptions) {
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

        let finish_reason: string = "";
        let promptTokens: number = 0;
        let resultTokens: number = -1;   //-1 Used as a trigger to see if it has been changed
        for await (const chunk of stream) {
            if (chunk) {
                if (typeof chunk === 'string'){
                    chunks.push(chunk);
                    yield chunk;
                }else{
                    if(!(finish_reason == "stop" && !chunk.result)){    //Used to skip empty chunk after stop
                        chunks.push(chunk.result);
                        finish_reason = chunk.finish_reason ?? "";
                        if(chunk.token_usage) {
                            promptTokens = chunk.token_usage.prompt ?? 0;      //Tokens returned include prior parts of stream, 
                            resultTokens = chunk.token_usage.result ?? 0;      //so overwrite rather than accumulate
                        }
                        yield chunk;
                    }
                }                
            }
        }

        //TODO: Confirm this is a true count for models/providers when streaming
        // If resultTokens is -1, i.e. chunks never had a token_usage, then use chunks.length
        resultTokens = resultTokens == -1 ? chunks.length : resultTokens;

        const content = chunks.join('');

        this.completion = {
            result: content,
            prompt: this.prompt,
            execution_time: Date.now() - start,
            token_usage: {
                prompt: promptTokens,
                result: resultTokens,
                total: resultTokens + promptTokens,
            },
            finish_reason: finish_reason
        }

        this.driver.validateResult(this.completion, this.options);
    }

}

export class FallbackCompletionStream<PromptT = any> implements CompletionStream<PromptT> {

    completion: ExecutionResponse<PromptT> | undefined;

    constructor(public driver: AbstractDriver<DriverOptions, PromptT>,
        public prompt: PromptT,
        public options: ExecutionOptions) {
    }

    async *[Symbol.asyncIterator]() {
        // reset state
        this.completion = undefined;
        this.driver.logger.debug(
            `[${this.driver.provider}] Streaming is not supported, falling back to blocking execution`
        );
        const completion = await this.driver._execute(this.prompt, this.options);
        const content = typeof completion.result === 'string' ? completion.result : JSON.stringify(completion.result);
        yield {result:content};

        this.completion = completion;
    }
}
