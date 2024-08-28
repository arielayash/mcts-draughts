import {INode} from "./inode.js"

export class Node extends INode {

    _state;     // IState
    _parent;    // INode
    // _child;     // {IAction: INode}      // TODO: Javascript doesn't work well with classes as keys - find a way to reuse the O(1) option
    
    _actions;   // List[IAction]
    _nodes;     // List[INode]

    constructor(state, parent) {

        super();

        this._state = state;
        this._parent = parent;
        
        // this._child = {}
        this._actions = [];
        this._nodes = [];
    }

    getState() { return this._state; }

    getParent() { return this._parent; }

    getActions() { return this._actions; }

    getChild(action) { 

        
        var index = -1;
        for (var i = 0; i < this._actions.length; ++i) {
            if (this._actions[i].getId() == action.getId()) {
                index = i;
                break;
            }
        }

        return this._nodes[index];
      
        // return this._child[action]; 
    }

    addChild(action, node) {  
        
        // this._child[action] = node; 
        this._actions.push(action);        
        this._nodes.push(node);
    }
}
