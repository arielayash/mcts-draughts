import {NotImplementedError} from "./exceptions.js"

export class IMcts {

    search() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method search()`);
    }

    setRoot(node) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method setRoot()`);
    }

    getAction() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getAction()`);
    }
}