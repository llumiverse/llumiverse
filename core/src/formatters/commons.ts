import { JSONSchema4 } from "json-schema";

export function getJSONSafetyNotice(schema: JSONSchema4) {
    return "The answer must be a JSON object using the following JSON Schema:\n" + JSON.stringify(schema);
}
