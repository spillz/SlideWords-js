//@ts-check

import * as eskv from '../eskv/lib/eskv.js';

import { Player, playerNames} from './players.js';

export class MenuButton extends eskv.Button {
    /**@type {eskv.Button['draw']}*/
    draw(app, ctx) {
        let r = this.rect;
        ctx.beginPath();
        ctx.rect(r[0], r[1], r[2], r[3]/5);        
        ctx.rect(r[0], r[1] + r[3]*0.4, r[2], r[3]/5);        
        ctx.rect(r[0], r[1] + r[3]*0.8, r[2], r[3]/5);
        ctx.fillStyle = this._touching ? eskv.App.resources['colors']['menu_button_touched']: eskv.App.resources['colors']['score_text'];
        ctx.fill();

    }
}



export class Instructions extends eskv.ModalView {
    constructor(props={}) {
        super(); 
        this.mScrollView = null; 
        this.updateProperties(props);
    }
}

eskv.App.registerClass('Instructions', Instructions, 'ModalView');

export class ScoreDetail1p extends eskv.ModalView {
    constructor() {
        super();
        this.updateProperties({});
        /**@type {[string, number][]}*/
        this.scoreData = [];
        this.title = 'Start of the Game';
        this.detail = 'SCORE: 0';
    }

    reset() {
        /**@type {[string, number][]}*/
        this.scoreData = [];
        this.title = 'Start of the Game';
        this.detail = 'SCORE: 0';
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     * @param {[string, number][]} scoreData
     */
    setScoreData(players, scoreData) {
        this.scoreData = scoreData;
        this.updateText(players);
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     * @param {string} word
     * @param {number} score
     */
    add(players, word, score) {
        if (word === '' && score === 0) {
            word = '<PASS>';
        }
        this.scoreData.push([word, score]);
        this.updateText(players);
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     */
    updateText(players) {
        if (this.scoreData) {
            this.title = `Turn ${this.scoreData.length + 1}`;
            const total = this.scoreData.reduce((acc, item) => acc + item[1], 0);
            let detail = `SCORE: ${total}\n\n`;
            detail += this.scoreData.map((item, index) => `${item[1]} ${item[0]}`).join('\n');
            this.detail = detail;    
        }
    }
}

eskv.App.registerClass('ScoreDetail1p', ScoreDetail1p, 'ModalView');


export class ScoreDetail2p extends eskv.ModalView {
    constructor() {
        super();
        this.updateProperties({});
        this.reset({});
        /**@type {[string, number][]} */
        this.scoreData1 = [];
        /**@type {[string, number][]} */
        this.scoreData2 = [];
        this.title = 'Start of the Game';
        this.detail1 = '';
        this.detail2 = '';
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     */
    reset(players) {
        this.scoreData1 = [];
        this.scoreData2 = [];
        this.title = 'Start of the Game';
        const pname1 = (1 in players) ? players[1].name !== 'HUMAN' ? players[1].name : 'PLAYER 1' : 'UNKNOWN';
        this.detail1 = `${pname1}: 0`;
        const pname2 = (2 in players) ? players[2].name !== 'HUMAN' ? players[2].name : 'PLAYER 2' : 'UNKNOWN';
        this.detail2 = `${pname2}: 0`;    
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     * @param {[string, number][]} scoreData1 
     * @param {[string, number][]} scoreData2 
     */
    setScoreData(players, scoreData1, scoreData2) {
        /**@type {[string, number][]}*/
        this.scoreData1 = scoreData1;
        /**@type {[string, number][]}*/
        this.scoreData2 = scoreData2;
        this.updateText(players);
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     * @param {number} player 
     * @param {string} word
     * @param {number} score
     */
    add(players, player, word, score) {
        if (word === '' && score === 0) {
            word = '<PASS>';
        }
        if (player === 1) {
            this.scoreData1.push([word, score]);
        } else if (player === 2) {
            this.scoreData2.push([word, score]);
        }
        this.updateText(players);
    }

    /**
     * 
     * @param {Object<number, Player>} players 
     */
    updateText(players) {
        if (!this.scoreData2) return;
        this.title = `Turn ${this.scoreData2.length + 1}`;
        const total1 = this.scoreData1.reduce((acc, item) => acc + item[1], 0);
        const pname1 = players[1] ? players[1].name !== 'HUMAN' ? players[1].name : 'PLAYER 1': 'UNKNOWN';
        let detail1 = `${pname1}: ${total1}\n\n`;
        detail1 += this.scoreData1.map(item => `${item[1]} ${item[0]}`).join('\n');
        this.detail1 = detail1;

        const total2 = this.scoreData2.reduce((acc, item) => acc + item[1], 0);
        const pname2 = players[2] ? players[2].name !== 'HUMAN' ? players[2].name : 'PLAYER 2' : 'UNKNOWN';
        let detail2 = `${pname2}: ${total2}\n\n`;
        detail2 += this.scoreData2.map(item => `${item[0]} ${item[1]}`).join('\n');
        this.detail2 = detail2;
    }
}

eskv.App.registerClass('ScoreDetail2p', ScoreDetail2p, 'ModalView');


export class Menu extends eskv.ModalView {
    constructor(props={}) {
        super();
        this.selection = '';
        this.updateProperties(props);
    }
}

eskv.App.registerClass('Menu', Menu, 'ModalView');

export class MultiplayerMenu extends eskv.ModalView {
    constructor() {
        super();
        this.selection = ''; // Replaces NumericProperty
        this.player1 = 0; // Default value set for player1
        this.player2 = 0; // Default value set for player2
        //.concat(Object.values(playerTypes).map(p => p.name)); // Assuming playerTypes is an object
        this.updateProperties({});
        this.players = playerNames;
    }
}

eskv.App.registerClass('MultiplayerMenu', MultiplayerMenu, 'ModalView');


export class LeaderboardMenu extends eskv.ModalView {
    constructor() {
        super();
        this.selection = ''; // Similar to NumericProperty
        // Assuming playerTypes is a structured object with names as in the MultiplayerMenu class
        this.players = ['', 'Player 1', 'Player 2'];
        this.updateProperties({});
    }
}

eskv.App.registerClass('LeaderboardMenu', LeaderboardMenu, 'ModalView');


export class ScoreBar extends eskv.BoxLayout {
    constructor(props={}) {
        super();
        this.score = 0;
        this.score_2 = 0;
        this.hiScore = 0;
        this.gameId = '';
        this.playerCount = 1;
        this.activePlayer = 1;
        this.store = this.getStore();
        this.bind("score", (e,o,v)=>this.scoreChanged())
        this.setGameId();
        this.updateProperties(props);
    }

    getStore() {
        const scores = localStorage.getItem('SlideWordsApp/scores');
        return scores ? JSON.parse(scores) : {};
    }

    setStore(key, value) {
        const scores = this.getStore();
        scores[key] = value;
        localStorage.setItem('SlideWordsApp/scores', JSON.stringify(scores));
    }

    setGameId(gameId = 'default', multiplayer = false) {
        this.playerCount = (multiplayer ? 1 : 0) + 1;
        this.activePlayer = 1;
        this.gameId = gameId;
        if (this.playerCount === 1) {
            const data = this.store[this.gameId];
            this.hiScore = data ? data.highScore : 0;
        }
    }

    scoreChanged() {
        if (this.playerCount === 2) return;
        if (this.gameId !== 'default') {
            const date = new Date();
            const gameDate = `d${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}`;
            if (this.gameId !== gameDate) {
                this.setGameId();
            } else {
                let hiScore = 0;
                if ('default' in this.store) {
                    hiScore = this.store['default'].highScore || 0;
                }
                if (this.score > hiScore) {
                    this.setStore('default', { highScore: this.score });
                }
            }
        }
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            this.setStore(this.gameId, { highScore: this.score });
        }
    }
}
         
eskv.App.registerClass('ScoreBar', ScoreBar, 'BoxLayout');

export class WordBar extends eskv.Button {
    word = '';
    wordScore = 0;
    canPass = false;
    constructor(props={}) {
        super();
        this.updateProperties(props);
    }
}

eskv.App.registerClass('WordBar', WordBar, 'Button')


export class MessageBar extends eskv.BoxLayout {
    constructor(props = {}) {
        super();
        this.message = '';  // Equivalent to StringProperty
        this.updateProperties(props);
    }

    activePlayerChanged(scorebar, activePlayer) {
        if (scorebar.playerCount === 2) {
            this.message = `PLAYER ${scorebar.activePlayer}'S TURN`;
        }
    }

    /**
     * 
     * @param {ScoreBar} scorebar 
     * @param {Object<number, Player>} players
     * @param {boolean} gameOver 
     */
    gameOver(scorebar, players, gameOver) {
        if (gameOver) {
            if (scorebar.playerCount === 2) {
                if (scorebar.score_2 === scorebar.score) {
                    this.message = 'GAME OVER: DRAW!'                    
                } else {
                    const winner = scorebar.score_2 > scorebar.score ? 2:1;
                    if (players[winner].type === 1) {
                        this.message = `GAME OVER: PLAYER ${winner} WINS!`;
                    } else {
                        this.message = `GAME OVER: ${players[winner].name} WINS!`;
                    }    
                }
            } else {
                this.message = 'GAME OVER';
            }
        } else {
            if (this.message === 'GAME OVER') {
                this.message = '';
            }
        }
    }

    /**
     * 
     * @param {ScoreBar} scorebar 
     * @param {string} gameId 
     * @returns 
     */
    gameChanged(scorebar, gameId) {
        if (scorebar.playerCount === 2) return;
        this.gameId = gameId;
        if (gameId !== 'default') {
            const now = new Date();
            const nextDate = new Date(now);
            nextDate.setUTCHours(24, 0, 0, 0); // Setting to the next day, 00:00 UTC
            const delta = (nextDate.valueOf() - now.valueOf()) / 1000; // Delta in seconds
            if (delta > 0) {
                const hours = Math.floor(delta / 3600);
                const minutes = Math.floor((delta % 3600) / 60);
                const seconds = delta % 60;

                if (hours > 0) {
                    this.message = `${hours} HOUR${hours > 1 ? 'S' : ''} LEFT`;
                    setTimeout(() => this.onDailyChallengeTimer(scorebar, gameId), hours * 3600000);
                } else if (minutes > 0) {
                    this.message = `${minutes} MINUTE${minutes > 1 ? 'S' : ''} LEFT`;
                    setTimeout(() => this.onDailyChallengeTimer(scorebar, gameId), minutes * 60000);
                } else {
                    this.message = `${seconds} SECOND${seconds > 1 ? 'S' : ''} LEFT`;
                    setTimeout(() => this.onDailyChallengeTimer(scorebar, gameId), seconds * 1000);
                }
            } else {
                this.message = 'THE DAILY CHALLENGE HAS EXPIRED';
            }
        } else {
            this.message = '';
        }
    }

    onDailyChallengeTimer(scorebar, gameId) {
        if (gameId === this.gameId) {
            this.gameChanged(scorebar, gameId);
        }
    }
}

eskv.App.registerClass('MessageBar', MessageBar, 'BoxLayout');
