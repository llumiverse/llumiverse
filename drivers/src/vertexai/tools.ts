// As of 30 jan 2024 the latest vertexai release (v0.2.1) does not contains types for tools / functions
//TODO must be removed when the next version becomes available

/**
 * A predicted FunctionCall returned from the model that contains a string
 * representating the FunctionDeclaration.name with the parameters and their
 * values.
 * @property {string} - name The name of the function specified in
 * FunctionDeclaration.name.
 * @property {object} - args The arguments to pass to the function.
 */
export interface FunctionCall {
    name: string;
    args: object;
}

/**
 * The result output of a FunctionCall that contains a string representing
 * the FunctionDeclaration.name and a structured JSON object containing any
 * output from the function call. It is used as context to the model.
 * @property {string} - name The name of the function specified in
 * FunctionDeclaration.name.
 * @property {object} - response The expected response from the model.
 */
export interface FunctionResponse {
    name: string;
    response: object;
}

/**
 * Structured representation of a function declaration as defined by the
 * [OpenAPI 3.0 specification](https://spec.openapis.org/oas/v3.0.3). Included
 * in this declaration are the function name and parameters. This
 * FunctionDeclaration is a representation of a block of code that can be used
 * as a Tool by the model and executed by the client.
 * @property {string} - name The name of the function to call. Must start with a
 * letter or an underscore. Must be a-z, A-Z, 0-9, or contain underscores and
 * dashes, with a max length of 64.
 * @property {string} - description Description and purpose of the function.
 * Model uses it to decide how and whether to call the function.
 * @property {FunctionDeclarationSchema} - parameters Describes the parameters
 * to this function in JSON Schema Object format. Reflects the Open API 3.03
 * Parameter Object. string Key: the name of the parameter. Parameter names are
 * case sensitive. Schema Value: the Schema defining the type used for the
 * parameter. For function with no parameters, this can be left unset. Example
 * with 1 required and 1 optional parameter: type: OBJECT properties:
 
      param1:
 
        type: STRING
      param2:
 
        type: INTEGER
    required:
 
      - param1
 */
export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: FunctionDeclarationSchema;
}

/**
 * A Tool is a piece of code that enables the system to interact with
 * external systems to perform an action, or set of actions, outside of
 * knowledge and scope of the model.
 * @property {object} - function_declarations One or more function declarations
 * to be passed to the model along with the current user query. Model may decide
 * to call a subset of these functions by populating
 * [FunctionCall][content.part.function_call] in the response. User should
 * provide a [FunctionResponse][content.part.function_response] for each
 * function call in the next turn. Based on the function responses, Model will
 * generate the final response back to the user. Maximum 64 function
 * declarations can be provided.
 */
export interface Tool {
    function_declarations: FunctionDeclaration[];
}

/**
 * Contains the list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 * @public
 */
export enum FunctionDeclarationSchemaType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
    OBJECT = 'OBJECT',
}

/**
 * Schema for parameters passed to [FunctionDeclaration.parameters]
 * @public
 */
export interface FunctionDeclarationSchema {
    type: FunctionDeclarationSchemaType;
    properties: { [k: string]: FunctionDeclarationSchemaProperty };
    description?: string;
    required?: string[];
}

/**
 * Schema is used to define the format of input/output data.
 * Represents a select subset of an OpenAPI 3.0 schema object.
 * More fields may be added in the future as needed.
 * @public
 */
export interface FunctionDeclarationSchemaProperty {
    type?: FunctionDeclarationSchemaType;
    format?: string;
    description?: string;
    nullable?: boolean;
    items?: FunctionDeclarationSchema;
    enum?: string[];
    properties?: { [k: string]: FunctionDeclarationSchema };
    required?: string[];
    example?: unknown;
}
