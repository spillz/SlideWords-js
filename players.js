//@ts-check

import * as eskv from '../eskv/lib/eskv.js';
import { boardDim } from './globals.js';
import { Board, Tile, words } from './main.js';

/**
 * 
 * @param {number} count 
 * @param {Map<string, number>} choices 
 * @param {number} seed 
 * @returns 
 */
function weightedChoice(count, choices, seed) {
    const originalSeed = eskv.rand.getSeed(); // Save original state
    eskv.rand.setSeed(seed); // Seed the random number generator
    let ch = new Map(choices.entries()); // Copy choices into a new Map
    let output = new Set();

    for (let x = 0; x < count; x++) {
        const total = Array.from(ch.values()).reduce((acc, weight) => acc + weight, 0);
        let r = Math.floor(eskv.rand.random() * total);
        let upto = 0;

        for (let [c, w] of ch) {
            if (upto + w > r) {
                ch.delete(c);
                output.add(c);
                break;
            }
            upto += w;
        }
    }
    eskv.rand.setSeed(originalSeed)
    return output;
}

/**
 * 
 * @param {number} count 
 * @param {Set<string>} choices 
 * @param {number} seed 
 * @returns 
 */
function unweightedChoice(count, choices, seed) {
    const originalSeed = eskv.rand.getSeed();
    eskv.rand.setSeed(seed);
    const outputArray = [...choices.values()];
    eskv.rand.shuffle(outputArray);
    const output = new Set(outputArray.slice(0, count));
    eskv.rand.setSeed(originalSeed)
    return output;
}


export class Player {
    playerId = 1;
    numPlayers = 2;
    name = 'HUMAN';
    type = 1;

    /**
     * 
     * @param {Board} board 
     * @param {number} pid 
     */
    constructor(board, pid) {
        this.playerId = pid;
        this.board = board;
    }

    startTurn() {
        // Logic to start a turn
    }

    localTouch() {
        return !this.board.gameOver;
    }

    abort() {
        return true;
    }

    reset() {
        // Reset player state
    }
}

class AITile {
    /**
     * 
     * @param {Tile} tile 
     */
    constructor(tile) {
        this.letter = tile.letter;
        this.value = tile.value;
    }
}

// // class AIBoard {
// //     /**
// //      * 
// //      * @param {AITile[][]|null} tiles 
// //      */
// //     constructor(tiles = null) {
// //         if (tiles === null) {
// //             this._tiles = Array.from({ length: boardDim }, () => Array(boardDim).fill(null));
// //         } else {
// //             this._tiles = tiles;
// //         }
        
// //     }
// //     copy() {
// //         return new AIBoard(this._tiles.map(row => [...row]));
// //     }

// //     getItem(tup) {
// //         return this._tiles[tup[0]][tup[1]];
// //     }

// //     setItem(tup, tile) {
// //         this._tiles[tup[0]][tup[1]] = tile;
// //     }

// //     contains(tup) {
// //         if (tup === null) {
// //             return false;
// //         }
// //         return this._tiles[tup[0]][tup[1]] !== null;
// //     }

// //     delItem(tup) {
// //         this._tiles[tup[0]][tup[1]] = null;
// //     }
// // }

// let useAIBoard = false;
        

/**@typedef {Object<string, AITile|number>} AIBoard */

export class AIPlayer extends Player {
    /**
     * 
     * @param {Board} board 
     * @param {number} pid 
     */
    constructor(board, pid) {
        super(board, pid);
        this.type = 1;
        this.vocab = 0;  // number of words in vocabulary (0 for all)
        this.randomVocab = false;  // true to randomly determine the vocab (weighted by frequency)
        this.randomVocabSeed = 0;  // the seed to use to draw the vocab
        this.maxWordLen = boardDim;  // maximum length of words to check for
        this.maxChecks = 500000;  // maximum number of word checks allowed before turn ends
        this.name = '';  // no name suppresses from the list of playable AIs
        this._abort = false;  // set to true when a game is aborted
        this._dead = false;  // when a game is aborted, dead is set to true
        this.counter = 0;
        /**@type {[[number, number],[number, number]][]} */
        this.sel = [];
        /**@type {Set<string>} */
        this.words = new Set();
        this.setupWords()
        this.initState = this.boardState();
    }

    reset() {
        this._dead = false;
    }

    boardState() {
        /**@type {AIBoard} */
        let state = {};
        for (let xy of this.board.tiles.keys()) {
            const tile = this.board.tiles.get(xy);
            if (tile instanceof Tile) {
                state[`${tile.gpos[0]},${tile.gpos[1]}`] = new AITile(tile);
            }
        }
        return state;
    }

    /**
     * 
     * @param {AIBoard} state 
     * @returns 
     */
    emptyCells(state) {
        let emptyCells = [];
        for (let x = 0; x < boardDim; x++) {
            for (let y = 0; y < boardDim; y++) {
                let pos = `${x},${y}`;
                if (!(pos in state)) {
                    emptyCells.push([x, y]);
                }
            }
        }
        return emptyCells;
    }

    /**
     * 
     * @param {AIBoard} state 
     * @param {[number, number]} pos 
     * @returns 
     */
    slideables(state, pos) {
        let slideables = [];
        let directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        directions.forEach(dz => {
            let q = 1;
            let x = pos[0] + q * dz[0], y = pos[1] + q * dz[1];
            while (x >= 0 && x < boardDim && y >= 0 && y < boardDim) {
                if (`${x},${y}` in state) {
                    if (state[`${x},${y}`] !== 1) {  // assuming 1 denotes selected
                        slideables.push([x, y]);
                    }
                    break;
                }
                q++;
                x = pos[0] + q * dz[0], y = pos[1] + q * dz[1];
            }
        });
        return slideables;
    }

    /**
     * 
     * @param {AIBoard} state 
     * @param {[number, number]} pos 
     * @returns 
     */
    neighbors(state, pos) {
        let neighbors = [];
        let directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        directions.forEach(diff => {
            let npos = [pos[0] + diff[0], pos[1] + diff[1]];
            if (`${npos[0]},${npos[1]}` in state) {
                neighbors.push(npos);
            }
        });
        return neighbors;
    }
    
    /**
     * 
     * @param {AIBoard} state 
     * @param {[number, number][]} sel 
     * @returns 
     */
    arrangeSel(state, sel) {
        return sel.map(s => `${s[0]},${s[1]}` in state ? /**@type {[[number,number],[number,number]]}*/([s, s]) : /**@type {[[number,number]|null,[number,number]]}*/([null, s]));
    }
    
    /**
     * 
     * @param {AIBoard} state 
     * @param {[number, number][]} sel 
     * @returns 
     */
    getWordsInRange(state, sel) {
        const arrSel = this.arrangeSel(state, sel);
        const empty = arrSel.map((item, index) => item[0] === null ? index : -1).filter(index => index !== -1);
        if (empty.length === 0) {
            return [];
        }
        let stateCopy = {...state}
        arrSel.forEach(s => {
            if (s[0]!==null) {
                if (`${s[0][0]},${s[0][1]}` in stateCopy) {
                    stateCopy[`${s[0][0]},${s[0][1]}`] = 1;
                }    
            }
        });
    
        /**@type {[string, number, [[number,number],[number,number]]][]} */
        let candidates = [];
        /**
         * 
         * @param {AIBoard} state 
         * @param {number} k 
         */
        const getWordsRecurs = (state, k) => {
            const dst = arrSel[empty[k]][1];
            state[`${dst[0]},${dst[1]}`] = 1;
            this.slideables(state, dst).forEach(ss => {
                if (this._abort) {
                    return [];
                }
                if (this.counter > this.maxChecks) {
                    return;
                }
                const sst = `${ss[0]},${ss[1]}`;
                const tmp = state[sst];
                delete state[sst];
                arrSel[empty[k]][0] = ss;
                if (k < empty.length - 1) {
                    getWordsRecurs(state, k + 1);
                } else {
                    this.counter++;
                    const word = arrSel.map(s => this.initState[`${s[0][0]},${s[0][1]}`].letter).join('');
                    if (this.words.has(word) || this.words.has([...word].reverse().join(''))) {
                        const score = arrSel.reduce((acc, s) => acc + this.initState[`${s[0][0]},${s[0][1]}`].value, 0) * word.length;
                        const nsel = arrSel.map(s => [s[0], s[1]]);
                        candidates.push([word, score, nsel]);
                    }
                }
                state[sst] = tmp;  // restore state
            });
            delete state[`${dst[0]},${dst[1]}`];  // cleanup state
        };
    
        getWordsRecurs(stateCopy, 0);
        return candidates;
    }

    /**
     * 
     * @param {[number, number]} d
     * @param {number} position
     * @returns {[number, number][]}
     */
    coordList(d, position) {
        if (d[0] === 1 && d[1] === 0) {
            // Horizontal line
            return Array.from({length: boardDim}, (_, index) => [index, position]);
        }
        if (d[0] === 0 && d[1] === 1) {
            // Vertical line
            return Array.from({length: boardDim}, (_, index) => [position, index]);
        }
        if (d[0] === 1 && d[1] === 1) {
            // Diagonal from top-left to bottom-right
            if (position >= 0) {
                return Array.from({length: boardDim - position}, (_, index) => [index + position, index]);
            } else {
                return Array.from({length: boardDim + position}, (_, index) => [index, index - position]);
            }
        }
        if (d[0] === 1 && d[1] === -1) {
            // Diagonal from top-right to bottom-left
            if (position >= 0) {
                return Array.from({length: boardDim - position}, (_, index) => [index + position, boardDim - 1 - index]);
            } else {
                return Array.from({length: boardDim + position}, (_, index) => [index, boardDim - 1 - index + position]);
            }
        }
        return [];
    }
    
    /**
     * 
     * @param {AIBoard} state 
     * @param {[number, number]} d 
     * @param {number} position 
     * @returns 
     */
    wordsOnLine(state, d, position) {
        let candidates = [];
        let coords = this.coordList(d, position);
    
        for (let start_point = 0; start_point < coords.length; start_point++) {
            for (let end_point = start_point + 1; end_point < Math.min(coords.length, start_point + this.maxWordLen); end_point++) {
                console.log('AI step', this.counter);  // Adjusted for JavaScript console output
                if (this._abort) {
                    return [];
                }
                if (this.counter > this.maxChecks) {
                    return candidates;
                }
                let wordsInRange = this.getWordsInRange(state, coords.slice(start_point, end_point + 1));
                candidates = candidates.concat(wordsInRange);
            }
        }
        return candidates;
    }

    setupWords() {
        if (this.vocab <= 0) {
            this.vocab = words.size;
            this.words = words;
        } else if (this.randomVocab) {
            this.words = unweightedChoice(this.vocab, words, this.randomVocabSeed);
        } else {
            this.words = new Set([...words.values()].slice(-this.vocab)); // Assuming 'words' is an array sorted by frequency or importance
        }
    }

    findMove() {
        this.counter = 0;
        let state = {...this.initState}; // Assuming initState is an object and making a shallow copy
        let candidates = [];
        let empty = this.emptyCells(state);
        let lines = new Set();
    
        empty.forEach(e => {
            lines.add([1, 0, e[1]]);
            lines.add([0, 1, e[0]]);
            lines.add([1, 1, e[1] - e[0]]);
            lines.add([1, -1, e[0] - e[1]]);
        });
    
        lines.forEach(l => {
            candidates = candidates.concat(this.wordsOnLine(state, [l[0], l[1]], l[2]));
            if (this.counter > this.maxChecks) {
                return;
            }
            if (this._abort) {
                this._abort = false;
                return;
            }
        });
    
        if (candidates.length > 0) {
            let maxScore = Math.max(...candidates.map(c => c[1]));
            let bestCandidates = candidates.filter(c => c[1] === maxScore);
            console.log('number of candidates', bestCandidates.length);
            setTimeout(() => this.foundWord(this.chooseRandom(bestCandidates)), 1);
            return;
        }
        setTimeout(() => this.noWordFound(), 1);
    }
    
    /**
     * @template T
     * @param {T[]} array 
     * @returns 
     */
    chooseRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
        
    startTurn() {
        this.initState = this.boardState();
        this.findMove();  // This should ideally be asynchronous
    }

    /**
     * 
     * @param {[string, number, [[number, number],[number,number]][]]} choice 
     */
    foundWord(choice) {
        const [word, score, sel] = choice;
        this.sel = sel;
        this.doNext();
    }
    
    noWordFound() {
        this.sel = [];
        this.doNext();
    }
    
    doNext() {
        eskv.App.get().requestFrameUpdate();
        if (this._dead) {
            return;
        }
        if (this.sel.length>0) {
            const [src, dest] = this.sel.shift(); // Removes the first element and returns it
            this.board.selectInPos(this.board.getAtGpos(new eskv.Vec2(src)), new eskv.Vec2(dest));
            setTimeout(() => this.doNext(), 500); // Schedule the next action after 0.5 seconds    
        } else {
            setTimeout(() => this.endTurn(), 2000); // Schedule end turn after 2 seconds if an error occurs
        }
    }
    
    endTurn() {
        eskv.App.get().requestFrameUpdate();
        if (this._dead) {
            return;
        }
        this.board.endTurn();
    }
    
    localTouch() {
        return false; // Indicates that this AI player does not respond to local touch interactions
    }
}
                
class Antrax extends AIPlayer {
    name = 'AI ANTRAX'
    type = 2
    vocab = 5000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = 5 //maximum length of words to check for 
    maxChecks = 100000 //maximum number of word checks allowed before turn ends
}
                
class Blaine extends AIPlayer {
    name = 'AI BLAINE'
    type = 3
    vocab = 7000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = 7 //maximum length of words to check for 
    maxChecks = 200000 //maximum number of word checks allowed before turn ends
}

class Cyclops extends AIPlayer {
    name = 'AI CYCLOPS'
    type = 4
    vocab = 15000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = 7 //maximum length of words to check for 
    maxChecks = 200000 //maximum number of word checks allowed before turn ends
}

class Doctor extends AIPlayer {
    name = 'AI DOCTOR'
    type = 5
    vocab = 15000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = boardDim //maximum length of words to check for 
    maxChecks = 200000 //maximum number of word checks allowed before turn ends
}

class Earth extends AIPlayer {
    name = 'AI EARTH'
    type = 6
    vocab = 20000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = boardDim //maximum length of words to check for 
    maxChecks = 200000 //maximum number of word checks allowed before turn ends
}

class Fess extends AIPlayer {
    name = 'AI FESS'
    type = 7
    vocab = 25000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = boardDim //maximum length of words to check for 
    maxChecks = 300000 //maximum number of word checks allowed before turn ends
}

class Golem extends AIPlayer {
    name = 'AI GOLEM XIV'
    type = 8
    vocab = 50000 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = boardDim //maximum length of words to check for 
    maxChecks = 500000 //maximum number of word checks allowed before turn ends
}

class Harlie extends AIPlayer {
    name = 'AI HARLIE'
    type = 9
    vocab = 0 //number of words in vocabulary (0 for all)
    randomVocab = false //True to randomly determine the vocab (weighted by frequency)
    randomVocabSeed = 0 //The seed to use to draw the vocab
    maxWordLen = boardDim //maximum length of words to check for 
    maxChecks = 500000 //maximum number of word checks allowed before turn ends
}

export const playerTypes = {
    1: Player,
    2: Antrax,
    3: Blaine,
    4: Cyclops,
    5: Doctor,
    6: Earth,
    7: Fess,
    8: Golem,
    9: Harlie,
}

export const playerNames = {
    1: 'HUMAN',
    2: 'AI ANTRAX',
    3: 'AI BLAINE',
    4: 'AI CYCLOPS',
    5: 'AI DOCTOR',
    6: 'AI EARTH',
    7: 'AI FESS',
    8: 'AI GOLEM',
    9: 'AI HARLIE',
}
