
function extractJsonFromText(text: string): string {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    return text.substring(start, end + 1);
}

//TODO LAX parse JSON
export function parseJSON(text: string): Json {
    return JSON.parse(extractJsonFromText(text));
}

export type JsonPrimative = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimative | JsonComposite;
