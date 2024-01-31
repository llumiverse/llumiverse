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


function getTensorType(val: any) {
    if (val == null) {
        return null;
    }
    if (Array.isArray(val)) {
        if (val.length > 0) {
            val = val[0]
        } else {
            return 'listVal';
        }
    }
    const type = typeof val;
    if (type === 'string') {
        return 'stringVal';
    }
    if (type === 'number') {
        if (val % 1 === 0) { // is interger
            return 'intVal';
        } else {
            return 'floatVal';
        }
    }
    if (type === 'boolean') {
        return 'boolVal';
    }
    if (type === 'object') {
        return 'structVal';
    }
    return undefined;
}

export function formatArrayAsTensor(arr: any[]): any {
    return arr.map(item => {
        const type = typeof item;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return item; // primitve values 
        } else {
            return _formatObjectAsTensor(item)
        }
    });
}

/**
 * Do not support nested array or nested object arrays
 * @param obj 
 * @returns 
 */
function _formatObjectAsTensor(obj: any, isField = false): any {
    const struct: any = {};
    const keys = Object.keys(obj);
    for (const key of keys) {
        //console.log('###', key);
        const val = obj[key];
        const type = getTensorType(val);
        if (type === 'structVal') {
            if (Array.isArray(val)) {
                struct[key] = formatArrayAsTensor(val);
            } else {
                struct[key] = {
                    [type]: Array.isArray(val) ? formatArrayAsTensor(val) : _formatObjectAsTensor(val, true)
                }
            }
        } else if (type) {
            struct[key] = {
                [type]: val
            }
        }
    }
    return isField ? struct : {
        structVal: struct
    };
}

export function formatObjectAsTensor(obj: any) {
    return _formatObjectAsTensor(obj).structVal;
}


function test() {
    const obj = {
        instances: [
            {
                prompt: '\n' +
                    '  What is the color of the following entity: flower.\n' +
                    '\n' +
                    'The answer must be a JSON object using the following JSON Schema:\n' +
                    '{"type":"object","properties":{"color":{"type":"string"}},"required":["color"]}'
            }
        ],
        parameters: { temperature: 0.7, maxOutputTokens: 100 }
    }
    console.log('%o', formatObjectAsTensor(obj));

    const instances = obj.instances.map(inst => formatObjectAsTensor(inst));
    const parameters = formatObjectAsTensor(obj.parameters);

    console.log('++++++++++++++\n', { inputs: instances, parameters });


    const newPrompt = formatObjectAsTensor({
        inputs: obj.instances,
        parameters: obj.parameters
    });

    console.log('###################\n', newPrompt)

}


test()