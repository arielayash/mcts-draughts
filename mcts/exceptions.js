export class NotImplementedError extends Error { 
    
    constructor(message, options) {
        // Need to pass `options` as the second parameter to install the "cause" property.
        super(message, options);
    }
}

export class RuntimeError extends Error {
    constructor(message, options) {
        // Need to pass `options` as the second parameter to install the "cause" property.
        super(message, options);
    }
}

// Usage:
// console.log(new MyError("test", { cause: new Error("cause") }).cause);