import {NotImplementedError} from "./exceptions.js"

export class ISimState {

    simulate(...params) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method simulate()`);
    }
}

export class IState {

    simulate(...params) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method simulate()`);
    }

    getValidActions() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getValidActions()`);
    }

    isTerminal() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method isTerminal()`);
    }

    getSimState() {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getSimState()`);
    }

    setSimState(newSimState) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method setSimState()`);
    } 
}