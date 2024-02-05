import {
  TransformStream,
} from 'node:stream/web';

const transform = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(chunk.toUpperCase());
  },
});

const [r1, r2] = await Promise.all([
  transform.writable.getWriter().write('A'),
  transform.readable.getReader().read(),
]); 

console.log('++++++', r2)

