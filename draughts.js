import { DraughtsSimulator } from "./simulator.js"
import { ExpandPolicy, TreePolicy, SimPolicy, UCTSearch, UCTNode } from "./mcts/uct_search.js"
import { RuntimeError } from "./mcts/exceptions.js"
import { Player } from "./board.js";
import { initGUI, renderBoard } from "./gui.js";

import { randomActionChooser } from "./mcts/uct_search.js"

var gSim = undefined;
var gSimSearch = undefined;
var gUctSearch = undefined;

const AGENT_NUM_ITER_SEARCH = 2000;


function _rewardCalculator (allStatesAction) {

    // allStatesAction: List[List[DraughtsState, DraughtsAction]]
    
    if ( ! allStatesAction[allStatesAction.length - 1][0].isTerminal() ) {
        throw RuntimeError('Last state is not a terminal state');
    }

    return Player.WHITE == allStatesAction[allStatesAction.length - 1][0].getWinner()? 1.0 : 0.0;
}

function _calcWinners() {
    /*
     *
     *  Check the number of wins taking random actions. 
     *  The ratio expected to be ~50%
     *  This is also a smoke test for the simulator and action generator. 
     * 
     */

    const N = 1000;    

    var sim = new DraughtsSimulator();

    var numWhiteWins = 0;
    for (var i = 0; i < N; ++i) {

        if (i % 100 == 0) {
            console.log(`i: ${i}\tnum white wins: ${numWhiteWins}`);            
        }

        sim.reset();

        var state = sim.getState();        
        
        while ( ! state.isTerminal() ) {
            const nextAction = randomActionChooser(state);
            state = sim.step(nextAction);                                                          
        }
        
        if (state.getWinner() == Player.WHITE) {
            numWhiteWins += 1;
        }
    }

    console.log(`# white wins: ${numWhiteWins}`);
    console.log(`% white wins: ${(numWhiteWins / N) * 100.0}`);
}


function _initGame() {

    gSim = new DraughtsSimulator();
    gSimSearch = new DraughtsSimulator();

    var expandPolicy = new ExpandPolicy(gSimSearch);

    var treePolicy = new TreePolicy(expandPolicy);

    var simPolicy = new SimPolicy(gSimSearch, _rewardCalculator);

    gUctSearch = new UCTSearch(treePolicy, simPolicy);

    console.log("Done game initialization");
}


function _checkGameOver (state) {

    if (null != state.getWinner()) {
        console.log(`${state.getWinner()} wins!`);
        return true;
    }
    if (state.isTerminal()) {
        console.log(`Game over`);                        
        return true;    
    }

    return false;
}


function clientStepHandler (clientActionToTake) {
    const nextState = gSim.step(clientActionToTake);
    return _checkGameOver(nextState);
}

function agentStepHandler () {

    const simState = gSim.getSimState();
    gSimSearch.loadState(simState);

    const searchState = gSimSearch.getState();
    if (searchState.isTerminal()) {
        throw new RuntimeError("State is terminal!!!");
    }

    const rootNode = new UCTNode(searchState);
    gUctSearch.setRoot(rootNode);
    
    const nextAgentAction = gUctSearch.search(AGENT_NUM_ITER_SEARCH);

    const nextState = gSim.step(nextAgentAction);                                                          
    return _checkGameOver(nextState)
}

function _init () {

    _initGame();
     
    initGUI(gSim, clientStepHandler, agentStepHandler);    
}

window.onload = () => {

    // _calcWinners();
    // return;

    _init();

    document.getElementById("restart_btn").onclick = () => {
        document.getElementById("div_popup").style.display = 'none';
        _init();
    };    
}