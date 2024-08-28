import {NotImplementedError} from "./exceptions.js"


export class ISimulator {
    
    step(action) {
        // Return IState
        throw NotImplementedError(`Class ${this.constructor.name} must implement method step()`);
    }

    getSimState() {
        // Return ISimState
        throw NotImplementedError(`Class ${this.constructor.name} must implement method getSimState()`);
    }

    loadState(simState) {
        throw NotImplementedError(`Class ${this.constructor.name} must implement method loadState()`);
    }
}