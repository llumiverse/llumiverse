

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
            return formatObjectAsTensor(item)
        }
    });
}

/**
 * Do not support nested array or nested object arrays
 * @param obj 
 * @returns 
 */
function formatObjectAsTensor(obj: any, isField = false): any {
    const struct: any = {};
    const keys = Object.keys(obj);
    for (const key of keys) {
        //console.log('###', key);
        const val = obj[key];
        const type = getTensorType(val);
        if (type === 'structVal') {
            if (Array.isArray(val)) {
                struct[key] = { listVal: formatArrayAsTensor(val) };
            } else {
                struct[key] = {
                    [type]: formatObjectAsTensor(val, true)
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


export function generateStreamingPrompt(prompt: { instances: any, parameters: any }): any {
    return {
        inputs: prompt.instances.map((inst: any) => formatObjectAsTensor(inst)),
        parameters: formatObjectAsTensor(prompt.parameters)
    }
}
