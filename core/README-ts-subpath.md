When exporting subpaths from package.json, the projects which consumes your package will only be able to build to ESM and not to commonjs in typescript. 

This is because typescript generate commonjs code only if moduleResolution = Node10. (i.e. module=commonjs)
But this reaolution is not supporting imports from dependencies with export subpaths. (you need to use Node16 or NodeNext)

To be able to build in commonjs you need thus to set moduleResolution = Node10 and to use the `typesVersion` in package.json as a workaround (to map async to the right .d.ts file):

### Example: 
```    
    "types": "./lib/types/index.d.ts",
    "typesVersions": {
        "*": {
            "async": [
                "./lib/types/async.d.ts"
            ]
        }
    },
        "exports": {
        ".": {
            "types": "./lib/types/index.d.ts",
            "import": "./lib/esm/index.js",
            "require": "./lib/cjs/index.js",
            "default": "./lib/esm/index.js"
        },
        "./async": {
            "types": "./lib/types/async.d.ts",
            "import": "./lib/esm/async.js",
            "require": "./lib/cjs/async.js",
            "default": "./lib/esm/async.js"
        }
    },
```

See mode info here:
https://stackoverflow.com/questions/76236503/not-able-to-get-typescript-definitions-working-when-using-subpath-exports

And

https://www.npmjs.com/package/typescript-subpath-exports-workaround

