import {Node} from "./node.js"
import {RuntimeError} from "./exceptions.js"
import {IMcts} from "./imcts.js"


export class UCTNode extends Node {

    _numVisits;
    _totalValue;
    _meanValue;

    constructor(state, parent = null) {
        
        super(state, parent);

        this._numVisits = 0;
        this._totalValue = 0.0;
        this._meanValue = 0.0;
    }

    backup(value) {
        this._numVisits += 1;
        this._totalValue += value;
        this._meanValue = this._totalValue / this._numVisits;
    }

    getNumVisits() { return this._numVisits; }

    getMeanValue () { return this._meanValue; }

    evalAction (action) {
        
        const child = this.getChild(action);

        const tmp = 2.0 * Math.log(this.getNumVisits());

        const c = 1.0 / Math.sqrt(2.0);     // UCT coefficient

        return child.getMeanValue() + c * Math.sqrt(tmp / child.getNumVisits());
    }
}

function defaultBackupPolicy(node, reward) {

    while (node != null) {
        node.backup(reward);
        node = node.getParent();
    }
}

function maxVisitedActionChooser(node) {

    var maxVisits = -1
    var mostVisitedAction = undefined
    
    for (const action of node.getActions()) {

        const child = node.getChild(action);
        const currNumVisits = child.getNumVisits();

        const currVal = node.evalAction(action);

        if (currNumVisits > maxVisits) {
            maxVisits = currNumVisits;
            mostVisitedAction = action;
        }
    }

    console.assert(mostVisitedAction !== undefined, "Node with no actions to choose from on maxVisitedActionChooser()");
    
    return mostVisitedAction;
}

function maxEvalNodeChooser(node) {

    var maxValue = -1e30;
    var bestAction = undefined;

    for (const action of node.getActions()) {

        const currVal = node.evalAction(action);
        if (currVal > maxValue) {
            maxValue = currVal;
            bestAction = action;
        }
    }

    console.assert(bestAction !== undefined, "Node with no actions to choose from on maxEvalNodeChooser()");

    return node.getChild(bestAction);
}

function randomUntakenActionChooser(node) {

    const allValidActions = node.getState().getValidActions();
    const takenActions = node.getActions();

    const takenActionsId = [];
    for (const a of takenActions) {
        takenActionsId.push(a.getId());
    }

    function generateRandomPermutation(n) {
        let permutation = Array.from({ length: n }, (_, i) => i);    
        permutation.sort(() => Math.random() - 0.5);
    
        return permutation;
    }

    const randomPerm = generateRandomPermutation(allValidActions.length);
    
    for (const i of randomPerm) {
        var action = allValidActions[i];        
        if ( ! takenActionsId.includes(action.getId()) ) {            
            return action;
        }        
    }
   
    console.assert(false, "No untaken action from node in randomUntakenActionChooser()");
    return null;
}

export function randomActionChooser(state) {

    const allValidActions = state.getValidActions();
    
    const numActions = allValidActions.length;
    
    const index = Math.floor(Math.random() * numActions);

    return allValidActions[index];
}

export class ExpandPolicy {

    _sim;
    _untakenActionChooser;

    constructor(sim, untakenActionChooser=randomUntakenActionChooser) {
        
        this._sim = sim;
        this._untakenActionChooser = untakenActionChooser;
    }

    expand(node) {

        // UCTNode -> UCTNode
    
        const nextAction = this._untakenActionChooser(node);        

        const simState = node.getState().getSimState();

        if (simState == null) {
            throw RuntimeError('Simulation state can not be None on expand');
        }

        this._sim.loadState(simState);

        const nextState = this._sim.step(nextAction);

        // Q: why do we set the sim state instead of the simulator?
        // nextState.setSimState(this._sim.getSimState());

        const child = new UCTNode(nextState, node);

        node.addChild(nextAction, child);

        return child;
    }
}

export class TreePolicy {
    
    _expandPolicy;
    _bestActionChooser;
    

    constructor (expandPolicy, bestActionChooser=maxEvalNodeChooser) {

        this._expandPolicy = expandPolicy;
        this._bestActionChooser = bestActionChooser;
    }

    traverse(node) {
        
        // UCTNode -> UCTNode

        while ( ! node.getState().isTerminal() ) {
            
            const takenActions = node.getActions();
            const allValidActions = node.getState().getValidActions();
            
            if (takenActions.length < allValidActions.length) {
                // Not all actions were taken - we can expand the node
                return this._expandPolicy.expand(node);
            }
            else {                
                node = this._bestActionChooser(node);
            }            
        }

        return node;
    }

}

export class SimPolicy {

    _sim;
    _rewardCalculator;
    _actionChooser;

    constructor(sim, rewardCalculator, actionChooser=randomActionChooser) {

        this._sim = sim;
        this._rewardCalculator = rewardCalculator;
        this._actionChooser = actionChooser;

    }

    rollout(state) {
        // IState -> float

        var allStatesActions = []; // List[Tuple[IState, IAction]]

        if ( ! state.isTerminal() ) {

            if (state.getSimState() == null) {
                throw RuntimeError("State for SimPolicy must have simulation state");
            }

            this._sim.loadState(state.getSimState());
        }

        while ( ! state.isTerminal() ) {
            
            const nextAction = this._actionChooser(state);

            allStatesActions.push( [state, nextAction] );

            state = this._sim.step(nextAction);
        }
        
        // Push the last state with no action for reward calculation
        allStatesActions.push( [state, null] );

        return this._rewardCalculator(allStatesActions);
    }
}

export class UCTSearch extends IMcts {

    _treePolicy;
    _simPolicy;
    _backupPolicy;
    _finalActionChooser;

    _isRunning;
    _root;

    constructor(treePolicy, simPolicy, backupPolicy = defaultBackupPolicy, finalActionChooser = maxVisitedActionChooser) {

        super();

        this._treePolicy = treePolicy;
        this._simPolicy = simPolicy;
        this._backupPolicy = backupPolicy;
        this._finalActionChooser = finalActionChooser;

        
        this._isRunning = false;
        this._root = undefined; 
    }

    search(maxNumIters = 1e30) {
        // int -> IAction

        if ( ! this._root ) {
            throw RuntimeError("Running search of UCTSearch without setting valid root node");
        }

        const validActions = this._root.getState().getValidActions();
        if (validActions.length == 1) {            
            return validActions[0];
        }

        this._isRunning = true;

        var currIter = 0;
        while (this._isRunning && currIter < maxNumIters) {

            const node = this._treePolicy.traverse(this._root);
            const reward = this._simPolicy.rollout(node.getState());
            this._backupPolicy(node, reward);

            currIter += 1
        }

        const resAction = this._finalActionChooser(this._root);        

        this._isRunning = false;

        return resAction;
    }

    setRoot(node) {
        
        if (this._isRunning) {
            throw RuntimeError('UCTSearch can not change root during search');
        }

        this._root = node;
    }

    getAction() {

        if ( ! this._root ) {
            throw RuntimeError('get_action() before setting root');
        }

        return this._finalActionChooser(this._root);
    }

}
