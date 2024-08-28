export const BOARD_SIZE = 8

export const Player = {
    WHITE: 'WHITE',
    BLACK: 'BLACK'
};

export const Cell = {
    EMPTY: 'EMPTY',
    BLACK: 'BLACK',
    WHITE: 'WHITE',
    BLACK_QUEEN: 'BLACK_QUEEN',
    WHITE_QUEEN: 'WHITE_QUEEN'
};

export class Pos {

    row;
    col;

    constructor(row, col) {
        this.row = row;
        this.col = col;
    }

    isEqual(other) {
        return this.row == other.row && this.col == other.col;
    }
}

export class Board {

    _cells;

    constructor(cells = null) {
        if (cells != null) {
            this._cells = cells;
        }
        else {
            this._cells = new Array(BOARD_SIZE * BOARD_SIZE).fill(Cell.EMPTY);
        }        
    }
    
    getPlayerInCell(pos) { return this._cells[pos.row * BOARD_SIZE + pos.col]}

    setPlayerInCell(pos, cell) { this._cells[pos.row * BOARD_SIZE + pos.col] = cell; }

    getBoardStats () {

        var counters = {};
        for (const name of Object.keys(Cell)) {
            counters[name] = 0;
        }
        
        for (const c of this._cells) {
            counters[c] += 1;
        }
        
        return counters;
    }

    static getStartBoard() {
        
        var res = new Board();
      
        var startCol = [0, 1, 0];
        
        for (var row = 0; row < 3; ++row) {
            for (var col = startCol[row]; col < BOARD_SIZE; col += 2) {
                res.setPlayerInCell(new Pos(row, col), Cell.WHITE);
            }            
        }

        var startCol = [1, 0, 1];    
        var i = 0;    
        for (var row = BOARD_SIZE - 1; row > BOARD_SIZE - 4; --row) {
            for (var col = startCol[i]; col < BOARD_SIZE; col += 2) {
                res.setPlayerInCell(new Pos(row, col), Cell.BLACK);
            }     
            ++i;       
        }

        return res;
    }

    clone () {
        return new Board(structuredClone(this._cells));        
    }

}

export function isOnBoard(pos) {
    
    if (pos.col >= BOARD_SIZE || pos.col < 0) {
        return false;
    }

    if (pos.row >= BOARD_SIZE || pos.row < 0) {
        return false;
    }

    return true;
}