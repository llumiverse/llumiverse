import { PromptOptions, PromptRole, PromptSegment } from "@llumiverse/core";


export function getPromptAsText(segments: PromptSegment[], options: PromptOptions): string {
    const content = [];
    const safety = [];
    for (const segment of segments) {
        if (segment.role === PromptRole.safety) {
            safety.push(segment.content);
        } else {
            content.push(segment.content);
        }
    }

    if (options.resultSchema) {
        safety.push("The answer must be a JSON object using the following JSON Schema:\n" + JSON.stringify(options.resultSchema));
    }

    return content.join('\n') + (safety.length > 0 ? '\n' + safety.join('\n') : '');
}
