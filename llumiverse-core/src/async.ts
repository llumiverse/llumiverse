
export async function* asyncMap<T, R>(asyncIterable: AsyncIterable<T>, callback: (value: T, index: number) => R) {
    let i = 0;
    for await (const val of asyncIterable)
        yield callback(val, i++);
}

export function oneAsyncIterator<T>(value: T): AsyncIterable<T> {
    return {
        async *[Symbol.asyncIterator]() {
            yield value
        }
    }
}


export class EventStream<T, ReturnT = any> implements AsyncIterable<T>{

    private queue: T[] = [];
    private pending?: {
        resolve: (result: IteratorResult<T, ReturnT | undefined>) => void,
        reject: (err: any) => void
    };
    private done = false;


    push(event: T) {
        if (this.done) {
            throw new Error('Cannot push to a closed stream');
        }
        if (this.pending) {
            this.pending.resolve({ value: event });
            this.pending = undefined;
        } else {
            this.queue.push(event);
        }
    }

    /**
     * Close the stream. This means the stream cannot be feeded anymore.
     * But the consumer can still consume the remaining events.
     */
    close(value?: ReturnT) {
        this.done = true;
        if (this.pending) {
            this.pending.resolve({ done: true, value });
            this.pending = undefined;
        }
    }

    [Symbol.asyncIterator](): AsyncIterator<T, ReturnT | undefined> {
        const self = this;
        return {
            next(): Promise<IteratorResult<T, ReturnT | undefined>> {
                const next = self.queue.shift();
                if (next !== undefined) {
                    return Promise.resolve({ value: next });
                } else if (self.done) {
                    return Promise.resolve({ done: true, value: undefined as ReturnT });
                } else {
                    return new Promise<IteratorResult<T, ReturnT | undefined>>((resolve, reject) => {
                        self.pending = { resolve, reject };
                    });
                }
            },
            async return(value?: ReturnT | Promise<ReturnT>): Promise<IteratorResult<T, ReturnT>> {
                self.done = true;
                self.queue = [];
                if (value === undefined) {
                    return { done: true, value: undefined as ReturnT };
                }
                const _value = await value;
                return { done: true, value: _value };
            }
        }
    }
}



/**
 * Transform an async iterator by applying a function to each value.
 * @param originalGenerator
 * @param transform
 **/
export async function* transformAsyncIterator<T, V>(
    originalGenerator: AsyncIterable<T>,
    transform: (value: T) => V | Promise<V>
): AsyncIterable<V> {
    for await (const value of originalGenerator) {
        yield transform(value);
    }
}

//TODO move in a test file
// const max = 10; let cnt = 0;
// function feedStream(stream: EventStream<string>) {
//     setTimeout(() => {
//         cnt++;
//         console.log('push: ', cnt, max);
//         stream.push('event ' + cnt);
//         if (cnt < max) {
//             console.log('next: ', cnt, max);
//             setTimeout(() => feedStream(stream), 1000);
//         } else {
//             console.log('end of stream');
//             stream.close();
//         }
//     }, 1000);
// }

// const stream = new EventStream<string>();
// feedStream(stream);

// for await (const chunk of stream) {
//     console.log('++++chunk:', chunk);
// }



