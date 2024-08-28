import { ISimulator } from "./mcts/isimulator.js"
import { Player, Board } from "./board.js"

import { DraughtsState, DraughtsSimState} from "./state.js"


export class DraughtsSimulator extends ISimulator {

    _currPlayer;
    _board;
    
    constructor () {

        super();

        this._currPlayer = undefined;
        this._board = undefined;

        this.reset();    
    }

    reset () {
        this._currPlayer = Player.BLACK;
        this._board = Board.getStartBoard();
    }
   
    step(action) {
        
        const [player, cellsToUpdate] =  action.take();

        for (const [pos, cellVal] of cellsToUpdate) {
            this._board.setPlayerInCell(pos, cellVal);
        }

        const nextPlayer = Player.BLACK == player? Player.WHITE : Player.BLACK;
        this._currPlayer = nextPlayer;

        return this.getState();
    }

    getState() {
        return new DraughtsState(this.getCurrentPlayer(), this.getBoard());
    }


    getSimState() {
        return new DraughtsSimState(this.getBoard(), this.getCurrentPlayer());
    }

    loadState(simState) {
        const [player, board] = simState.simulate();
        this._board = board;
        this._currPlayer = player;
    }   

    getBoard() { return this._board; }

    getCurrentPlayer() { return this._currPlayer; }
}