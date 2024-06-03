import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { extractAndParseJSON } from "./json.js";
import { ResultValidationError } from "./types.js";


const ajv = new Ajv({ coerceTypes: true, allowDate: true, strict: false});

//use ts ignore to avoid error with ESM and ajv-formats
// @ts-ignore This expression is not callable
addFormats(ajv)

export class ValidationError extends Error implements ResultValidationError {
    constructor(
        public code: 'validation_error' | 'json_error',
        message: string
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export function validateResult(data: any, schema: Object) {
    let json;

    if (typeof data === "string") {
        try {
            json = extractAndParseJSON(data);
        } catch (error: any) {
            throw new ValidationError("json_error", error.message)
        }
    } else {
        json = data;
    }

    const validate = ajv.compile(schema);
    const valid = validate(json);

    if (!valid) {
        const errors = validate.errors?.map(e => `${e.instancePath}: ${e.message}\n${JSON.stringify(e.params)}`).join(",\n\n");
        if (errors) {
            throw new ValidationError("validation_error", errors)
        } else {
            throw new ValidationError("validation_error", "Unknown validation error")
        }
    }

    return json;
}
