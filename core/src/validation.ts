import { JSONSchema4, validate } from "json-schema";
import { parseJSON } from "./json.js";
import { ResultValidationError } from "./types.js";

export class ValidationError extends Error implements ResultValidationError {
    constructor(
        public code: 'validation_error' | 'json_error',
        message: string
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}

export function validateResult(data: any, schema: JSONSchema4) {
    let json;
    if (typeof data === "string") {
        try {
            json = parseJSON(data);
        } catch (error: any) {
            throw new ValidationError("json_error", error.message)
        }
    } else {
        json = data;
    }
    const validation = validate(json, schema);
    if (!validation.valid) {
        throw new ValidationError(
            "validation_error",
            validation.errors.map(e => e.message).join(",\n"))
    }

    return json;
}
