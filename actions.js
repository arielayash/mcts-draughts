import {NotImplementedError} from "./mcts/exceptions.js"
import {IAction} from "./mcts/iaction.js"
import { Player, Cell, Pos, BOARD_SIZE, isOnBoard } from "./board.js";


class DraughtsAction extends IAction {

    _player;        // Player
    _srcPos;        // Pos
    _finalPos;      // Pos
    _skippedPos;    // List[Pos]
    _targetPos;     // List[Pos]    
    _cellsToUpdate; // List[Tuple[Pos, Cell]]

    _id;

    static nextId = 0;

    constructor (player, srcPos, finalPos, cellsToUpdate, skippedPos=[], targetPos=[]) {
        
        super();

        this._player = player;
        this._srcPos = srcPos;
        this._finalPos = finalPos;
        this._cellsToUpdate = cellsToUpdate;
        this._targetPos = targetPos;
        this._skippedPos = skippedPos;

        this._id = DraughtsAction.nextId++;
    }

    getId () { return this._id; }

    getSrcPos () { return this._srcPos; }

    getFinalPos () { return this._finalPos; }

    getSkippedPos () { return this._skippedPos; }

    getTargetPos () { return this._targetPos; }

    take() { return [this._player, this._cellsToUpdate]; }

    getPriority() { return this.getSkippedPos().length; }    
}


export class MenMoveAction extends DraughtsAction {
    
    _isMakingQueen;

    constructor (player, srcPos, finalPos, isMakingQueen) {
        
        var targetCellVal = undefined;
        if (isMakingQueen) {
            targetCellVal = Player.BLACK == player? Cell.BLACK_QUEEN : Cell.WHITE_QUEEN;
        }
        else {
            targetCellVal = Player.BLACK == player? Cell.BLACK : Cell.WHITE;
        }

        const cellsToUpdate = [
            [srcPos, Cell.EMPTY],
            [finalPos, targetCellVal]
        ];

        super(player, srcPos, finalPos, cellsToUpdate);
                
        this._isMakingQueen = isMakingQueen;
    }

    static isValid (finalPos, board) {

        if ( ! isOnBoard(finalPos) ) {
            return false;
        }

        if ( Cell.EMPTY != board.getPlayerInCell(finalPos) ) {
            return false;
        }   

        return true;
    }
}

export class MenJumpAction extends DraughtsAction {
            
    constructor (player, srcPos, skippedPos, targetPos) {

        var isMakingQueen = false;
        if ( Player.WHITE == player && targetPos[targetPos.length - 1].row == BOARD_SIZE - 1 ) {
            isMakingQueen = true;
        }

        if ( Player.BLACK == player && targetPos[targetPos.length - 1].row == 0 ) {            
            isMakingQueen = true;
        }

        var targetCellVal = undefined;
        if (isMakingQueen) {
            targetCellVal = Player.BLACK == player? Cell.BLACK_QUEEN : Cell.WHITE_QUEEN;
        }
        else {
            targetCellVal = Player.BLACK == player? Cell.BLACK : Cell.WHITE;
        }

        var cellsToUpdate = [ [srcPos, Cell.EMPTY] ];

        for (const p of skippedPos) {
            cellsToUpdate.push([p, Cell.EMPTY]);
        }
        
        cellsToUpdate.push([targetPos[targetPos.length - 1], targetCellVal]);

        super(player, srcPos, targetPos[targetPos.length - 1], cellsToUpdate, skippedPos, targetPos);        
    }
}

export class QueenMoveAction extends DraughtsAction {
    
    constructor (player, srcPos, finalPosPos) {

        const finalCellVal = Player.BLACK == player? Cell.BLACK_QUEEN : Cell.WHITE_QUEEN;

        const cellsToUpdate = [
            [srcPos, Cell.EMPTY],
            [finalPosPos, finalCellVal]
        ];

        super(player, srcPos, finalPosPos, cellsToUpdate);        
    }
}

export class QueenJumpAction extends DraughtsAction {
        
    constructor (player, srcPos, skippedPos, targetPos) {

        var cellsToUpdate = [ [srcPos, Cell.EMPTY] ];

        for (const p of skippedPos) {
            cellsToUpdate.push( [p, Cell.EMPTY] );
        }

        const finalCellVal = Player.BLACK == player? Cell.BLACK_QUEEN : Cell.WHITE_QUEEN;
        cellsToUpdate.push( [targetPos[targetPos.length - 1], finalCellVal] );

        super(player, srcPos, targetPos[targetPos.length - 1], cellsToUpdate, skippedPos, targetPos);                        
    }
}