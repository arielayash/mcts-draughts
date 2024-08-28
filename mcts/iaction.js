import {NotImplementedError} from "./exceptions.js"

export class IAction {

    take(...params) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method take()`);
    }
}