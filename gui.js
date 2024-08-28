import { RuntimeError } from "./mcts/exceptions.js";
import { BOARD_SIZE, Cell, Player } from "./board.js";
import { Pos } from "./board.js";

const MAX_BOARD_IMAGE_SIZE = 512;
// const BOARD_IMAGE_WIDTH = 512;
// const BOARD_IMAGE_HEIGHT = 512;
// const cellWidth = Math.trunc(BOARD_IMAGE_WIDTH / BOARD_SIZE);
// const cellHeight = Math.trunc(BOARD_IMAGE_HEIGHT / BOARD_SIZE);

const CLIENT_PLAYER = Player.BLACK;

var gSim = undefined;
var gClientStepCallback = undefined;
var gAgentStepCallback = undefined;

var gInitBoardImg = undefined;

var gActionsToDraw = null;

function _getBoardImageSize () {

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    const minDim = Math.min(vw, vh);

    return Math.min(Math.trunc(minDim * 0.92), MAX_BOARD_IMAGE_SIZE);
}

function _getCellSize () { return Math.trunc(_getBoardImageSize() / BOARD_SIZE); }

function _blurPage() {
    const blurElems = document.getElementsByClassName("enableBlur");    
    for (var elem of blurElems) {
        elem.style.filter = "blur(4px) grayscale(100%)"; 
    }
}

function _unblurPage() {
    const blurElems = document.getElementsByClassName("enableBlur");    
    for (var elem of blurElems) {
        elem.style.filter = "blur(0) grayscale(0)"; 
    }
}

function _getCellPixels(pos) {
    
    const cellSize = _getCellSize();
    const rowStartPix = pos.row * cellSize;
    const colStartPix = pos.col * cellSize;

    return [
        [rowStartPix, rowStartPix + cellSize], 
        [colStartPix, colStartPix + cellSize]
    ];
}

function _getCellPos(pixelX, pixelY) {

    const boardImageSize = _getBoardImageSize();
    if (pixelX < 0 || pixelX >= boardImageSize) {
        return undefined;
    }

    if (pixelY < 0 || pixelY >= boardImageSize) {
        return undefined;
    }

    const cellSize = _getCellSize();
    return new Pos(Math.trunc(pixelY / cellSize), Math.trunc(pixelX / cellSize));    
}

function _drawRect(img, pos, isSoftColor, isDouble) {
    const [rows, cols] = _getCellPixels(pos);   
    const p1 = new cv.Point(cols[0], rows[0]);    
    const p2 = new cv.Point(cols[1], rows[1]);    
    const color = isSoftColor? new cv.Scalar(70) : new cv.Scalar(0);

    cv.rectangle(img, p1, p2, color, 2);    
    
    if (isDouble) {
        const p3 = new cv.Point(cols[0] + 5, rows[0] + 5);    
        const p4 = new cv.Point(cols[1] - 5, rows[1] - 5);    

        cv.rectangle(img, p3, p4, color, 2);  
    }
}

function _drawX(img, pos) {

    const color = new cv.Scalar(40);

    const [rows, cols] = _getCellPixels(pos);   
    const p1 = new cv.Point(cols[0], rows[0]);    
    const p2 = new cv.Point(cols[1], rows[1]);    
    
    cv.line(img, p1, p2, color, 2);

    const p3 = new cv.Point(cols[0], rows[1]);    
    const p4 = new cv.Point(cols[1], rows[0]);    
    
    cv.line(img, p3, p4, color, 2);
}

function _genInitBoardImage () {

    const boardImageSize = _getBoardImageSize();
    gInitBoardImg = new cv.Mat(boardImageSize, boardImageSize, cv.CV_8UC1);
    if ( ! gInitBoardImg.isContinuous() ) {
        throw RuntimeError("OpenCV mat is not continuous!");
    }

    for (var i = 0; i < gInitBoardImg.data.length; ++i) {
        gInitBoardImg.data[i] = 255;
    }

    for (var i = 0; i < BOARD_SIZE; ++i) {

        for (var j = 0; j < BOARD_SIZE; ++j) {

            if (i % 2 == 0 && j % 2 == 1) {
                continue;
            }

            if (i % 2 == 1 && j % 2 == 0) {
                continue;
            }

            const [rows, cols] = _getCellPixels(new Pos(i, j));            

            for (var row = rows[0]; row < rows[1]; ++row) {
                for (var col = cols[0]; col < cols[1]; ++col) {                    
                    gInitBoardImg.data[row * gInitBoardImg.cols + col] = 128;
                }
            }            
        }
    }
}

function _genBoardImg(board) {

    if ( ! gInitBoardImg ) {
        _genInitBoardImage();
    }

    const img = gInitBoardImg.clone();

    for (var i = 0; i < BOARD_SIZE; ++i) {

        for (var j = 0; j < BOARD_SIZE; ++j) {

            const cellPlayer = board.getPlayerInCell(new Pos(i, j));
            if (Cell.EMPTY == cellPlayer) {
                continue;
            }

            const [rows, cols] = _getCellPixels(new Pos(i, j));            

            const center = new cv.Point(Math.trunc((cols[0] + cols[1]) / 2.0), Math.trunc((rows[0] + rows[1]) / 2.0)); 

            var color = new cv.Scalar(255);
            if (Cell.BLACK == cellPlayer || Cell.BLACK_QUEEN == cellPlayer) {                
                var color = new cv.Scalar(0);
            }

            const radius = Math.trunc( Math.min(cols[1] - cols[0], rows[1] - rows[0]) / 2.0 ) - 15;
            cv.circle(img, center, radius, color, -1);

            if (Cell.BLACK_QUEEN == cellPlayer || Cell.WHITE_QUEEN == cellPlayer) {
                
                const centerText = new cv.Point(center.x - 10, center.y + 10);

                if (Cell.BLACK_QUEEN == cellPlayer) {
                    color = new cv.Scalar(255);
                }
                else {
                    color = new cv.Scalar(0);
                }

                cv.putText(img, 'Q', centerText, cv.FONT_HERSHEY_SIMPLEX, 0.8, color, 2);
            }
        }
    }

    return img;
}

function _drawValidSrcPosForAction(img, state) {

    const allValidActions = state.getValidActions();

    for (const action of allValidActions) {
        _drawRect(img, action.getSrcPos(), true, true); 
    }
}

function _drawBoard (img) {    
    
    cv.imshow('board_img', img);
    img.delete();
}

export function renderBoard(board) {
    const img = _genBoardImg(board);
    _drawBoard(img);    
}

function _handleGameOver () {
    
    document.getElementById('board_img').removeEventListener("click", _onBoardClick);

    _blurPage()

    const winner = gSim.getState().getWinner();
    var msg = null;
    if (null == winner) {
        msg = "Game ends in a draw";
    }
    else {
        msg = `${winner} player wins!`;
    }

    document.getElementById('span_popup').innerText = msg;

    document.getElementById('div_popup').style.display = "flex";
}

function _onBoardClick (e) {

    if (null == gActionsToDraw && CLIENT_PLAYER != gSim.getCurrentPlayer()) {
        return;
    }

    const clickedCell = _getCellPos(e.offsetX, e.offsetY);
    if ( ! clickedCell ) {
        return;
    }

    function _selectCellAsSrc () {
        
        const img = _genBoardImg(gSim.getBoard());

        gActionsToDraw = [];

        const allValidActions = gSim.getState().getValidActions();

        for (const action of allValidActions) {        

            if ( ! action.getSrcPos().isEqual(clickedCell) ) {
                continue;
            }
            
            gActionsToDraw.push(action);            
        }

        if (gActionsToDraw.length < 1) {
            gActionsToDraw = null;
        }
        else {
            _drawRect(img, clickedCell, false, false); 
            
            for (const action of gActionsToDraw) {

                for (const skippedCell of action.getSkippedPos()) {
                    _drawX(img, skippedCell);
                }

                for (const targetCell of action.getTargetPos()) {
                    _drawRect(img, targetCell, true, false);                     
                }

                _drawRect(img, action.getFinalPos(), true, true);                 
            }
        }

        _drawBoard(img);
    }

    if ( ! gActionsToDraw ) {
        _selectCellAsSrc();        
        return;
    }
       
    if (CLIENT_PLAYER == gSim.getBoard().getPlayerInCell(clickedCell)) {
        _selectCellAsSrc();
    }
    else {

        var isActionFound = false;

        for (const action of gActionsToDraw) {
            if (action.getFinalPos().isEqual(clickedCell)) {
                
                // The client choosed an action 
                isActionFound = true;
                gActionsToDraw = null;
                
                if (gClientStepCallback(action)) {
                    _handleGameOver();   
                }
                
                renderBoard(gSim.getBoard());                
                
                // For some reason it must be in a Premise so the first render would work
                setTimeout(
                    () => {
                        if (gAgentStepCallback()) {
                            _handleGameOver();  
                        }         
                        
                        const img = _genBoardImg(gSim.getBoard());
                        _drawValidSrcPosForAction(img, gSim.getState());
                        _drawBoard(img);                           
                    },
                    0
                );                
            }
        }

        if ( ! isActionFound ) {
            // The client cancled his selection
            gActionsToDraw = null;

            const img = _genBoardImg(gSim.getBoard());
            _drawValidSrcPosForAction(img, gSim.getState());
            _drawBoard(img);     
        }
    }    
}

export function initGUI(sim, clientStepCallback, agentStepCallback) {

    gSim = sim;
    gClientStepCallback = clientStepCallback;
    gAgentStepCallback = agentStepCallback;

    console.log(`Board size [pix]: ${_getBoardImageSize()}x${_getBoardImageSize()}`);

    const img = _genBoardImg(gSim.getBoard());
    _drawValidSrcPosForAction(img, gSim.getState());
    _drawBoard(img);    
    
    document.getElementById('board_img').addEventListener("click", _onBoardClick);

    _unblurPage();   
}