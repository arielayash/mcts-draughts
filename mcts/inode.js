import {NotImplementedError} from "./exceptions.js"


export class INode {

    getState() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getState()`);
    }

    getActions () {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getActions()`);
    }

    evalAction(action) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method evalAction()`);
    }

    backup(value) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method backup()`);
    }

    getParent() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getParent()`);
    }

    getChild(action) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getChild()`);
    }

    addChild(action, node) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method addChild()`);
    }
}