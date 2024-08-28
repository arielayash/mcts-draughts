import {ISimState, IState} from "./mcts/istate.js"
import { Pos, Cell, Player, BOARD_SIZE, isOnBoard } from "./board.js";
import { RuntimeError } from "./mcts/exceptions.js";
import { MenMoveAction, MenJumpAction, QueenMoveAction, QueenJumpAction } from "./actions.js";

function _isPosInArray (pos, posArray) {    
    return posArray.find( (p) => pos.isEqual(p) ) != undefined;
}

function _genWhiteMenPlayerBasicActions (    
    pos,            // Player
    board,          // Board
    resActions      // List[DraughtsAction]
) {

    // Basic men move
    if (pos.row < BOARD_SIZE - 1) {

        const isMakeQueen = pos.row + 1 == BOARD_SIZE - 1;

        // Move left
        const targetPosLeft = new Pos(pos.row + 1, pos.col - 1);

        if (MenMoveAction.isValid(targetPosLeft, board)) {
            resActions.push( new MenMoveAction(Player.WHITE, pos, targetPosLeft, isMakeQueen) );
        }

        // Move right
        const targetPosRight = new Pos(pos.row + 1, pos.col + 1);

        if (MenMoveAction.isValid(targetPosRight, board)) {
            resActions.push( new MenMoveAction(Player.WHITE, pos, targetPosRight, isMakeQueen) );
        }
    }
}

function _genBlackMenPlayerBasicActions (    
    pos,            // Player
    board,          // Board
    resActions      // List[DraughtsAction]
) {

    // Basic men move
    if (pos.row > 0) {

        const isMakeQueen = pos.row - 1 == 0;

        // Move left
        const targetPosLeft = new Pos(pos.row - 1, pos.col - 1);

        if (MenMoveAction.isValid(targetPosLeft, board)) {
            resActions.push( new MenMoveAction(Player.BLACK, pos, targetPosLeft, isMakeQueen) );
        }

        // Move right
        const targetPosRight = new Pos(pos.row - 1, pos.col + 1);

        if (MenMoveAction.isValid(targetPosRight, board)) {
            resActions.push( new MenMoveAction(Player.BLACK, pos, targetPosRight, isMakeQueen) );
        }
    }
}

function _genManPlayerJumpActionsAux (
    player,                 // Player
    pos,                    // Pos
    srcPos,                 // Pos
    skippedPos,             // List[Pos]
    targetPos,              // List[Pos]
    visitedPos,             // List[Pos]
    board,                  // Board
    resActions              // List[DraughtsAction]
) {

    if ( ! isOnBoard(pos) ) {
        return;
    }

    if ( _isPosInArray(pos, visitedPos) ) {
        // pos is part of visited positions
        return;
    }

    var visitedPosNew = visitedPos.slice();
    visitedPosNew.push(pos);

    function _addAction(deltaRow, deltaCol) {

        const nextSkippedPos = new Pos(pos.row + deltaRow, pos.col + deltaCol); 

        if ( ! isOnBoard(nextSkippedPos) ) {
            return;
        }

        const nextTargetPos = new Pos(nextSkippedPos.row + deltaRow, nextSkippedPos.col + deltaCol); 

        if ( ! isOnBoard(nextTargetPos) ) {
            return;
        }
                
        const allowedSkippedCell = Player.BLACK == player? [Cell.WHITE, Cell.WHITE_QUEEN] : [Cell.BLACK, Cell.BLACK_QUEEN];
        if ( ! allowedSkippedCell.includes(board.getPlayerInCell(nextSkippedPos)) ) {
            return;
        }

        if ( Cell.EMPTY != board.getPlayerInCell(nextTargetPos) ) {
            return;
        }


        if ( _isPosInArray(nextTargetPos, visitedPosNew) ) {
            return;
        }

        // TODO: check if we can avoid some of the deep copies
        const skippedPosNew = skippedPos.concat([nextSkippedPos]);
        const targetPosNew = targetPos.concat([nextTargetPos]);

        resActions.push( new MenJumpAction(player, srcPos, skippedPosNew.slice(), targetPosNew.slice()) );

        _genManPlayerJumpActionsAux(player, nextTargetPos, srcPos, skippedPosNew, targetPosNew, visitedPosNew.slice(), board, resActions);
    }

    // Jump left up
    _addAction(1, -1);

    // Jump right up
    _addAction(1, 1);

    // Jump left down
    _addAction(-1, -1);

    // Jump right down
    _addAction(-1, 1);
}

function _genManPlayerJumpActions (player, pos, board) {

    var skippedPos = [];
    var targetPos = [];
    var visitedPos = [];
    var resActions = [];

    _genManPlayerJumpActionsAux(player, pos, pos, skippedPos, targetPos, visitedPos, board, resActions);

    return resActions;
}


function _genQueenPlayerMoveActions (player, pos, board, resActions) {

    function _addMoves (deltaRow, deltaCol) {
        
        var currTargetPos = pos;
        while (true) {
            
            currTargetPos = new Pos(currTargetPos.row + deltaRow, currTargetPos.col + deltaCol);

            if ( ! isOnBoard(currTargetPos) ) {
                break;
            }

            if ( Cell.EMPTY != board.getPlayerInCell(currTargetPos) ) {
                break;
            }
            
            resActions.push( new QueenMoveAction(player, pos, currTargetPos) );            
        }
    }

    // Move left up
    _addMoves(1, -1);

    // Move right up
    _addMoves(1, 1);

    // Move left down
    _addMoves(-1, -1);

    // Move right down
    _addMoves(-1, 1);
}

function _genQueenPlayerJumpActionsAux (
    player,             // Player
    pos,                // Pos
    srcPos,             // Pos    
    skippedPos,         // List[Pos]
    targetPos,          // List[Pos]
    board,              // Board
    directions,         // List[Tuple[int, int]]
    resActions          // List[DraughtsAction]
) {
    const allowedSkippedCell = Player.BLACK == player? [Cell.WHITE, Cell.WHITE_QUEEN] : [Cell.BLACK, Cell.BLACK_QUEEN];

    for (const direction of directions) {

        var posFirstSkipCellOnDir = null;

        var currPos = new Pos(pos.row, pos.col);

        while (true) {
            
            currPos = new Pos(currPos.row + direction[0], currPos.col + direction[1]);

            if ( ! isOnBoard(currPos) ) {
                // We are out of the board but no cell to skip was found
                break;
            }  

            const currCellPlayer = board.getPlayerInCell(currPos);

            if ( Cell.EMPTY == currCellPlayer ) {
                // Empty cell keep moving along the current direction
                continue;
            }

            if ( ! allowedSkippedCell.includes(currCellPlayer) ) {
                // First non-empty cell is not the opponent
                break;
            }

            posFirstSkipCellOnDir = currPos;
            break;
        }

        if (null == posFirstSkipCellOnDir) {
            continue;
        }

        if ( _isPosInArray(posFirstSkipCellOnDir, skippedPos) ) {
            // We already skipped this cell - continue to next direction
            continue;
        }

        
        var targetPosToRecurse = [];    // Next positions to recursively expand 
        var currTargetPos = posFirstSkipCellOnDir;
        while (true) {

            currTargetPos = new Pos(currTargetPos.row + direction[0], currTargetPos.col + direction[1]);

            if ( ! isOnBoard(currTargetPos) ) {
                break;
            }

            if ( Cell.EMPTY != board.getPlayerInCell(currTargetPos) ) {
                break;
            }

            targetPosToRecurse.push(currTargetPos);

            var newTargetPos = targetPos.concat([currTargetPos]);
            var newSkippedPos = skippedPos.concat([posFirstSkipCellOnDir]);

            // Add a valid action
            resActions.push( new QueenJumpAction(player, srcPos, newSkippedPos, newTargetPos) );
        }

        var newSkippedPos = skippedPos.concat([posFirstSkipCellOnDir]);

        // Recourse from the new target cells - skip the direction we came from

        const allDirectionsOnRecurse = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1]
        ];

        var directionsOnRecurse = [];

        const directionInv = [ direction[0] * -1, direction[1] * -1 ];
        
        for (const tmpDir of allDirectionsOnRecurse) {
            if (tmpDir[0] == directionInv[0] && tmpDir[1] == directionInv [1]) {
                continue;
            }
            directionsOnRecurse.push(tmpDir);
        }
        
        if (directionsOnRecurse.length != 3) {
            throw new RuntimeError("Error removing direction");
        }

        for (const nextTarget of targetPosToRecurse) {
            
            var newTargetPos = targetPos.concat([nextTarget]);

            _genQueenPlayerJumpActionsAux (
                player,
                nextTarget,
                srcPos,             
                newSkippedPos.slice(),
                newTargetPos,          
                board,      
                directionsOnRecurse, 
                resActions  
            );
        }
    }
}

function _genQueenPlayerJumpActions (player, pos, board) {

    var resActions = [];

    const directions = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
    ];

    _genQueenPlayerJumpActionsAux (
        player,
        pos,
        pos,             
        [],
        [],          
        board,      
        directions, 
        resActions  
    );

    return resActions;
}


export class DraughtsState extends IState {

    _player;
    _board;
    _simState;
    _validActions;  // Optional[List[DraughtsAction]]
    _winner;

    constructor (player, board) {

        super();

        this._player = player;
        this._board = board.clone();
        this._simState = null;
        this._validActions = null;
        
        this._winner = undefined;
    }

    simulate() { return; }

    _genValidActions () {

        var validActions = [];

        var maxPriority = 0;

        for (var i = 0; i < BOARD_SIZE; ++i) {
            for (var j = 0; j < BOARD_SIZE; ++j) {

                if (i % 2 == 0 && j % 2 == 1) {
                    continue;
                }

                if (i % 2 == 1 && j % 2 == 0) {
                    continue;
                }

                const cellPos = new Pos(i, j);

                const currCellVal = this._board.getPlayerInCell(cellPos);
                if (Cell.EMPTY == currCellVal) {
                    continue;
                }

                if (Player.BLACK == this.getPlayer() && [Cell.WHITE, Cell.WHITE_QUEEN].includes(currCellVal)) {
                    continue;
                }

                if (Player.WHITE == this.getPlayer() && [Cell.BLACK, Cell.BLACK_QUEEN].includes(currCellVal)) {
                    continue;
                }

                if (Cell.WHITE == currCellVal || Cell.BLACK == currCellVal) {

                    var resList = _genManPlayerJumpActions(this.getPlayer(), cellPos, this._board);

                    for (const a of resList) {
                        const currPriority = a.getPriority();
                        if (currPriority < maxPriority) {
                            continue;
                        }

                        if (currPriority > maxPriority) {
                            validActions = [];
                            maxPriority = currPriority;
                        }

                        validActions.push(a);
                    }

                    if (maxPriority < 1) {
                        // Gen basic man move
                        if (Cell.WHITE == currCellVal) {
                            _genWhiteMenPlayerBasicActions(cellPos, this._board, validActions);
                        }
                        else {
                            // Must be Cell.BLACK
                            _genBlackMenPlayerBasicActions(cellPos, this._board, validActions);
                        }
                    }

                }
                else if (Cell.WHITE_QUEEN == currCellVal || Cell.BLACK_QUEEN == currCellVal) {

                    var resList = _genQueenPlayerJumpActions(this.getPlayer(), cellPos, this._board);

                    for (const a of resList) {
                        const currPriority = a.getPriority();
                        if (currPriority < maxPriority) {
                            continue;
                        }

                        if (currPriority > maxPriority) {
                            validActions = [];
                            maxPriority = currPriority;
                        }

                        validActions.push(a);
                    }

                    if (maxPriority < 1) {
                        _genQueenPlayerMoveActions(this.getPlayer(), cellPos, this._board, validActions);
                    }
                }
            }
        }

        return validActions;
    }

    getValidActions() { 
        
        if (null == this._validActions) {
            this._validActions = this._genValidActions();
        }

        return this._validActions;
    }

    isTerminal() { return this.getValidActions().length < 1; }

    getSimState() { 
        
        if (null == this._simState) {
            this._simState = new DraughtsSimState(this._board, this.getPlayer());
        }

        return this._simState; 
    }

    setSimState(newSimState) { 

        this._player, this._board = newSimState.simulate();

        this._simState = newSimState; 
        this._validActions = null;
        this._winner = undefined;
    }


    getPlayer() { return this._player; }

    getWinner() { 

        if (undefined === this._winner) {
            this._winner = null;
            if (this.isTerminal()) {
                this._winner = Player.BLACK == this.getPlayer()? Player.WHITE : Player.BLACK;
            }
        }

        return this._winner; 
    }
}

export class DraughtsSimState extends ISimState {

    _board;
    _player;

    constructor (board, player) {

        super();

        this._board = board.clone();
        this._player = player;
    }

    simulate () {
        return [this._player, this._board.clone()];
    }
}