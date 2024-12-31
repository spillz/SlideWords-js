//@ts-check
import * as eskv from '../eskv/lib/eskv.js';
import * as colors from './colors.js';
import { Player, AIPlayer, playerTypes, playerNames} from './players.js';
import * as globals from './globals.js';

//@ts-ignore
import urlWords from './TWL06.txt?url';
//@ts-ignore
import markup from './slidewords.jkv?raw';

// const sounds = {
//     CANCEL_SELECTION: new Audio('sounds/cancel_selection.mp3'),
//     LEVEL_COMPLETED: new Audio('sounds/level_completed.mp3'),
//     LEVEL_FAILED: new Audio('sounds/level_failed.mp3'),
//     MENU: new Audio('sounds/menu.mp3'),
//     SELECT: new Audio('sounds/select.mp3'),
//     WORD_COMPLETED: new Audio('sounds/word_completed.mp3'),    
// }

/**
 * 
 * @param {Array<string>} elements 
 * @param {number} length 
 */
function* permutations(elements, length) {
    if (length === 1) {
        for (let elem of elements) {
            yield [elem];
        }
    } else {
        for (let i = 0; i < elements.length; i++) {
            let remainingElements = elements.slice(0, i).concat(elements.slice(i + 1));
            for (let perm of permutations(remainingElements, length - 1)) {
                yield [elements[i]].concat(perm);
            }
        }
    }
}

/**
 * @template T
 * @param {T} value 
 * @param {number} reps 
 * @returns 
 */
function repeat(value, reps) {
    return Array(reps).fill(value);
}

async function loadWords(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const words = new Set(text.split('\n'));
        return words;
    } catch (err) {
        console.error(`Error loading file: ${url}`, err);
        throw err;
    }
    return new Set('');
}

// async function loadMarkup(url) {
//     try {
//         const response = await fetch(url);
//         const text = await response.text();
//         return text;
//     } catch (err) {
//         console.error(`Error loading file: ${url}`, err);
//     }
//     return '';
// }

export class Tile extends eskv.Widget {
    /**
     * 
     * @param {Board} board 
     * @param {number} x 
     * @param {number} y 
     * @param {string} letter 
     * @param {number} value 
     */
    constructor(board, x, y, letter, value) {
        super();
        this.hints = {w:null, h:null};
        this.children = [
            new eskv.Label({
                text: letter,
                color: (app)=>app.colors['tile_letter_text'],
                fontSize: '0.8wh',
                hints: {x:0,y:0,w:1,h:1},
            }),
            new eskv.Label({
                text: ''+value,
                color: (app)=>app.colors['tile_letter_text'],
                fontSize: '0.8wh',
                hints: {x:0.67,y:0.67,w:.33,h:.33},
            })
        ]
        this.bgColor = eskv.App.resources['colors']['tile'];
        SlideWordsApp.get().bind('colors', (e,o,v)=>{
            this.updateBgColor();
        })
        this.letter = letter;
        this.value = value;
        this.gposX = x;
        this.gposY = y;
        this.oposX = this.gposX;
        this.oposY = this.gposY;
        this.cposX = this.gposX;
        this.cposY = this.gposY;
        this.posOffset = new eskv.Vec2([0,0]);
        [this.x, this.y] = this.gpos;
        this.board = board;
        this.selected = false;

    }

    draw(app, ctx) {
        super.draw(app, ctx);
    }

    on_letter(event, object, value) {
        this.children[0].text = value;
    }

    on_value(event, object, value) {
        this.children[1].text = ''+value;
    }

    updateBgColor() {
        let colors = eskv.App.resources['colors'];
        this.bgColor = this.selected? colors['tile_selected']: colors['tile'];
    }

    on_selected(event, object, value) {
        this.updateBgColor();
    }

    on_gpos(event, object, value) {
        if (this.cpos[0] === -1 && this.cpos[1] === -1) {
            this.opos = new eskv.Vec2(this.gpos);
            this.cpos = new eskv.Vec2(this.gpos);
        }
        const a = new eskv.WidgetAnimation();
        const p = this.board.gpos2pos(this.gpos);
        a.add({ x: p[0], y: p[1]}, 250 );
        a.start(this);
    }

    /**@type {eskv.Widget['on_touch_down']} */
    on_touch_down(e,o,touch) {
        if (!this.board.activePlayer.localTouch()) {
            return false;
        }
        if (this.board.blockGposUpdates) {
            return false;
        }
        if (this.gpos.equals([-1,-1])) {
            return false;
        }
        if (this.collide(touch.rect)) {
            if (this.selected) {
                this.board.resetSelected();
                touch.ungrab();
            } else {
                this.board.candidates = this.board.getMoveCandidates(this);
                if (this.board.candidates.length > 0) {
                    touch.grab(this);
                    this.posOffset = new eskv.Vec2([touch.pos.x - this.pos.x, touch.pos.y - this.pos.y]);
                }
            }
            return true;
        }
        return false;
    }
    
    /**@type {eskv.Widget['on_touch_move']} */
    on_touch_move(e,o,touch) {
        if (!this.board.activePlayer.localTouch()) {
            return false;
        }
        if (touch.grabbed === this) {
            this.x = touch.pos.x - this.posOffset.x;
            this.y = touch.pos.y - this.posOffset.y;
            return true;
        }
        return false;
    }
    
    /**@type {eskv.Widget['on_touch_up']} */
    on_touch_up(e,o,touch) {
        if (!this.board.activePlayer.localTouch()) {
            return false;
        }
        if (touch.grabbed === this) {
            let gpos = this.board.pos2gpos(touch.pos);
            if (this.board.candidates.find((gp)=>gp.equals(gpos))) {
                this.board.selectInPos(this, gpos);
            } else {
                this.gpos = this.opos;
            }
            this.pos = this.board.gpos2pos(this.gpos);
            this.board.candidates = [];
            touch.ungrab();
            return true;
        }
        return false;
    }
    
    // Getter and setter for gpos, opos, and cpos to trigger events
    get gpos() {
        return new eskv.Vec2([this.gposX, this.gposY]);
    }

    set gpos(value) {
        [this.gposX, this.gposY] = value;
        this.emit('gpos', value);
    }

    get opos() {
        return new eskv.Vec2([this.oposX, this.oposY]);
    }

    set opos(value) {
        [this.oposX, this.oposY] = value;
    }

    get cpos() {
        return new eskv.Vec2([this.cposX, this.cposY]);
    }

    set cpos(value) {
        [this.cposX, this.cposY] = value;
    }
}

            
export class Board extends eskv.Widget {
    gameOver = false;
    /**
     * 
     * @param {Set<string>} words 
     */
    constructor(words) {
        super();
        this.firstStart = true;
        this.updateProperties({});
        this.hints = {x:0, y:0, w:1, h:1};
        this.words = words;
        this.scorebar = new ScoreBar();
        this.wordbar = new WordBar();
        this.messagebar = new  MessageBar();
        this.scorebar.bind('gameId', (e,o,v)=>this.messagebar.gameChanged(o,v));
        this.scorebar.bind('players', (e,o,v)=>this.messagebar.activePlayerChanged(o,v));
        this.scorebar.bind('score', (e,o,v)=>this.updatePassBar());
        this.scorebar.bind('score_2', (e,o,v)=>this.updatePassBar());
        this.scorebar.bind('activePlayer', (e,o,v)=>this.messagebar.activePlayerChanged(o,v));
        this.scorebar.bind('touch_down', (e,o,v)=>this.onTouchScore(o,v));
        this.wordbar.bind('touch_down', (e,o,v) => this.confirmWord(o,v));
        this.bind('gameOver', (e,o,v)=>this.messagebar.gameOver(o, v));
        this.menu = new Menu();
        this.menu.bind('selection', (e,o,v) => this.menuChoice(o,v));
        this.menuButton = new eskv.Button({text:'MENU', 
            bgColor:eskv.App.resources['colors']['menu_button_background'], 
            selectColor:eskv.App.resources['colors']['menu_button_touched'],
            align: 'center',
        });
        this.menuButton.bind('press', (e,o,v) => this.showMenu());
        this.multiplayerMenu = new MultiplayerMenu();
        this.multiplayerMenu.bind('selection', (e,o,v) => this.menuChoice(o,v));
        this.leaderboardMenu = new LeaderboardMenu();
        this.leaderboardMenu.bind('selection', (e,o,v) => this.menuChoice(o,v));
        /**@type {Map<number, Tile>} */
        this.tiles = new Map();
        /**@type {eskv.Vec2[]} */
        this.selection = [];
        /**@type {eskv.Vec2[]} */
        this.candidates = [];
        this.addChild(this.scorebar);
        this.addChild(this.wordbar);
        this.addChild(this.messagebar);
        this.addChild(this.menuButton);
        this.block_gpos_updates = false;
        this.instructions = new Instructions();
        this.players = {1: new Player(this, 1)}
        this.scoreDetail1p = new ScoreDetail1p();
        this.scoreDetail2p = new ScoreDetail2p();
        this.activePlayer = this.players[1];
        this.gameOver = false;
        this.consecutivePasses = 0;
        this.tileSpaceSize = 1;
        this.offX = 0;
        this.offY = 0;
        this.boardSize = globals.boardDim;
        this.tileSpaceSize = 1;
        this.tileSize = 1;
        this.consecutivePasses = 0;

        /**@type {[string, number][]} */
        let tile_set = []
        for(let t of globals.tiles) {
            for (let _ = 0; _<t[2]; ++_) {
                tile_set.push([t[0], t[1]+1]);
            }
        }

        /**@type {[number,number][]} */
        this.initial_tile_positions = [];
        this.originalGps = this.initial_tile_positions.slice();
        const mid =  Math.floor(globals.boardDim / 2)
        for (let x = 0; x < globals.boardDim; x++) {
            for (let y = 0; y < globals.boardDim; y++) {
                if (x >= mid - 1 && x <=mid && y >= mid - 1 && y <= mid) continue;
                this.initial_tile_positions.push([x, y]);
            }
        }

        this.tileWidgets = [];
        for (let i = 0; i < this.initial_tile_positions.length; i++) {
            let [x,y] = this.initial_tile_positions[i];
            let [l,v] = tile_set[i];
            let t = new Tile(this, -1, -1, l, v);
            this.addChild(t);
            this.tileWidgets.push(t);
        }

        this.first_start = true;
        this.ai = new AIPlayer(this, 2);
    }

    overlayShowing() {
        return this.children.includes(this.menu) ||
            this.children.includes(this.multiplayerMenu) ||
            this.children.includes(this.leaderboardMenu) ||
            this.children.includes(this.instructions) ||
            this.children.includes(this.scoreDetail1p) ||
            this.children.includes(this.scoreDetail2p);
    }

    showLeaderboardMenu() {
        this.leaderboardMenu.selection = '';
        this.addChild(this.leaderboardMenu);
    }

    hide_leaderboard_menu() {
        if (this.children.includes(this.leaderboardMenu))
        {
            this.removeChild(this.leaderboardMenu);
        }
    }

    showMenu() {
        this.menu.selection = '';
        this.menu.popup();
    }

    hideMenu() {
        this.menu.close();
        // this.hide_multiplayer_menu();
        this.hide_leaderboard_menu();
    }

    menuChoice(menu, selection) {
        if (selection == 'restartGame') {
            this.hideMenu();
            this.restartGame();
        }
        else if (selection == 'randomGame') {
            this.hideMenu();
            this.newGame();
        }
        else if (selection == 'dailyGame') {
            this.hideMenu();
            this.newDailyGame();
        }
        else if (selection == 'multiplayerMenu') {
            this.hideMenu();
            this.multiplayerMenu.popup();
        }
        else if (selection == 'instructions') {
            this.hideMenu();
            this.instructions.popup();
        }
        else if (selection == 'leaderboardMenu') {
            this.hideMenu();
            this.leaderboardMenu.popup();
        }
        else if (selection == 'achievements') {
            this.hideMenu();
        }
        else if (selection == 'theme') {
            /**@type {SlideWordsApp}*/(eskv.App.get()).setNextTheme();
            this.hideMenu();
            this.showMenu();
        }
        else if (selection == 'quit') {
            this.hideMenu();
            // App.get_running_app().stop();
        }
        else if (selection == 'multiplayerGame') {
            this.multiplayerMenu.close();
            this.newMultiplayerGame();
        }
        else if (selection == 'player1') {
            if (this.multiplayerMenu.player1 < Object.keys(playerTypes).length) {
                this.multiplayerMenu.player1 += 1;
            } else {
                this.multiplayerMenu.player1 = 1;
            }
        }
        else if (selection == 'player2') {
            if (this.multiplayerMenu.player2 < Object.keys(playerTypes).length) {
                this.multiplayerMenu.player2 += 1;
            } else {
                this.multiplayerMenu.player2 = 1;
            }
        }
    }

    /**
     * 
     * @param {eskv.Vec2} pos 
     * @returns {eskv.Vec2}
     */
    pos2gpos(pos) {
            return new eskv.Vec2([Math.floor((pos[0] - this.offX) / this.tileSpaceSize), Math.floor((pos[1] - this.offY) / this.tileSpaceSize)]);
    }

    newGame() {
        this.activePlayer.abort();
        this.originalGps = this.initial_tile_positions.slice();
        eskv.rand.setSeed(Date.now());
        eskv.rand.shuffle(this.originalGps);
        this.players = {
            1: new Player(this, 1)
        }
        this.activePlayer = this.players[1];
        this.scorebar.setGameId();
        this.reset();
    }

    newDailyGame() {
        this.activePlayer.abort();
        const date = new Date(Date.now());
        eskv.rand.setSeed(date.getUTCFullYear()*1000+date.getUTCMonth()*100+date.getUTCDate());
        this.originalGps = this.initial_tile_positions.slice();
        eskv.rand.shuffle(this.originalGps);
        const gameId = `d${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDate()}`;
        this.players = {
            1: new Player(this, 1),
        }
        this.activePlayer = this.players[1];
        this.scorebar.setGameId(gameId);
        this.reset();
    }

    newMultiplayerGame() {
        this.activePlayer.abort();
        this.originalGps = this.initial_tile_positions.slice();
        eskv.rand.setSeed(Date.now());
        eskv.rand.shuffle(this.originalGps);
        this.players = {
            1: new playerTypes[this.multiplayerMenu.player1](this, 1),
            2: new playerTypes[this.multiplayerMenu.player2](this, 2),
        }
        this.activePlayer = this.players[1];
        this.scorebar.setGameId('', true);
        this.reset();
    }

    restartGame() {
        this.activePlayer.abort();
        this.activePlayer = this.players[1];
        this.scorebar.activePlayer = 1;
        for (let p in this.players) {
            this.players[p].reset();
        }
        this.reset();
    }

    reset() {
        this.gameOver = false;
        this.consecutivePasses = 0;
        this.scorebar.score = 0;
        this.scorebar.score_2 = 0;
        this.wordbar.word = '';
        this.wordbar.wordScore = 0;
        this.selection = [];
        this.scoreDetail1p.reset(this.players);
        this.scoreDetail2p.reset(this.players);
        setTimeout(() => {
            this.resetTick(0)
        }, 1);
    }

    resetTick(i) {
        eskv.App.get().requestFrameUpdate();
        if (i === 0) {
            this.block_gpos_updates = true;
            this.tiles.clear();
        }
        const anim_count = 5;
        const anim_ind = Math.min(this.tileWidgets.length, i + anim_count);
        let j = i;
        while (j < anim_ind) {
            const t = this.tileWidgets[j];
            const gp = new eskv.Vec2(this.originalGps[j]);
            t.opos = gp;
            t.cpos = gp;
            t.gpos = gp;
            t.selected = false;
            this.setAtGpos(t.gpos, t);
            j += 1;
        }
        if (j < this.tileWidgets.length) {
            setTimeout(()=>this.resetTick(j), 10);
            // SlideWordsApp.get().addTimer( 0.01*(j-1), ()=>this.resetTick());
        } else {
            this.block_gpos_updates = false;
            setTimeout(()=>this.activePlayer.startTurn(), 10);
            // SlideWordsApp.get().addTimer( 0.25, ()=>this.activePlayer.startTurn());
        }
    }

    /**
     * 
     * @param {eskv.Vec2} gpos 
     * @returns 
     */
    gpos2pos(gpos) {
        if (gpos[0] === -1 && gpos[1] === -1) {
            return new eskv.Vec2([this.size[0]/2, this.size[1]*1.2]);
        } else {
            return new eskv.Vec2([this.offX + this.tileSpaceSize*gpos[0], this.offY + this.tileSpaceSize*gpos[1]]);
        }
    }

    /**
     * Converts the vec2 position to an index into the map of `tiles`
     * @param {eskv.Vec2} gpos 
     * @returns 
     */
    _conv_pos(gpos) {
        return Math.floor(gpos[0])*globals.boardDim + Math.floor(gpos[1]);
    }

    /**
     * Recover the vec2 position from the `tiles` key value
     * @param {number} key 
     * @returns 
     */
    _unconv_pos(key) {
        return new eskv.Vec2([Math.floor(key/globals.boardDim), key%globals.boardDim])
    }

    /**
     * 
     * @param {eskv.Vec2} gpos 
     * @param {Tile} value 
     */
    setAtGpos(gpos, value) {
        this.tiles.set(this._conv_pos(gpos),value);
    }

    /**
     * 
     * @param {eskv.Vec2} gpos 
     */
    getAtGpos(gpos) {
        return this.tiles.get(this._conv_pos(gpos));
    }

    /**
     * 
     * @param {eskv.Vec2} gpos 
     */
    deleteAtGpos(gpos) {
        this.tiles.delete(this._conv_pos(gpos));
    }

    /**
     * 
     * @param {eskv.Vec2} gpos 
     */
    has_at_gpos(gpos) {
        return this.tiles.has(this._conv_pos(gpos));
    }

    /**@type {eskv.Widget['layoutChildren']} */
    layoutChildren() {
        const boardDim = globals.boardDim; // Assuming board size is a constant value
        this.tileSpaceSize = 1; //Math.min(this.size[0], 0.8*this.size[1]) / boardSize;
        this.tileSize = this.tileSpaceSize*0.99;
        this.boardSize = boardDim * this.tileSpaceSize;
        this.offX = (this.size[0] - this.boardSize) / 2;
        this.offY = 2;

        this.menuButton.size = new eskv.Vec2([2, 1]);
        this.menuButton.pos = new eskv.Vec2([0, this.size[1]-1]);

        // Update messageBar size and position
        this.messagebar.size = new eskv.Vec2([this.size[0], 1]);
        this.messagebar.pos = new eskv.Vec2([0, this.size[1]-1]);

        // Update wordBar size and position
        this.wordbar.size = new eskv.Vec2([this.size[0] * 3 / 4, 0.8]);
        this.wordbar.pos = new eskv.Vec2([this.size[0] / 8, this.size[1] - 1.9 - (this.size[1] - this.boardSize - 4)/2 ]);

        // Update scoreBar size and position
        this.scorebar.size = new eskv.Vec2([this.size[0], 2]);
        this.scorebar.pos = new eskv.Vec2([0, 0]);

        // Update tile positions and sizes
        this.tileWidgets.forEach(tile => {
            tile.pos = this.gpos2pos(tile.gpos);
            tile.size = new eskv.Vec2([this.tileSize, this.tileSize]);
        });

        super.layoutChildren();

        // Handle first start logic
        if (this.firstStart) {
            this.firstStart = false;
            try {
                if (!this.loadState()) {
                    this.newGame();
                }
            } catch (error) {
                this.newGame();
            }
            window.onbeforeunload = () => SlideWordsApp.get().onStop();
        }
    }
    
    /**@type {eskv.Widget['draw']} */
    draw(app, ctx) {
        // Clear the canvas and set the background color
        ctx.clearRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = colors.background;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Draw checkerboard pattern
        ctx.fillStyle = colors.checker;
        for (let x = 0; x < globals.boardDim; x++) {
            for (let y = 0; y < globals.boardDim; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(
                        this.offX + x * this.tileSpaceSize,
                        this.offY + y * this.tileSpaceSize,
                        this.tileSpaceSize,
                        this.tileSpaceSize
                    );
                }
            }
        }

        const candidates = this.candidates;
        // Draw move candidates if any
        if (candidates !== null) {
            ctx.fillStyle = colors.moveCandidates;
            candidates.forEach(c => {
                let [x, y] = c;
                ctx.fillRect(
                    this.offX + x * this.tileSpaceSize + this.tileSpaceSize / 4,
                    this.offY + y * this.tileSpaceSize + this.tileSpaceSize / 4,
                    this.tileSize / 2,
                    this.tileSize / 2
                );
            });
        }
    }

    /**
     * 
     * @param {Tile} tile 
     * @param {eskv.Vec2} gpos 
     * @returns 
     */
    selectInPos(tile, gpos) {
        this.deleteAtGpos(tile.gpos);
        tile.gpos = gpos;
        this.setAtGpos(gpos, tile);
        this.selection.push(tile.gpos);
        tile.selected = true;
        this.updateWordBar();
        return true;
    }

    updateWordBar() {
        this.updatePassBar();
        const res = this.isSelectionAWord();
        this.wordbar.word = res.word;
        this.wordbar.wordScore = res.value;
    }

    updatePassBar() {
        this.wordbar.canPass = !this.gameOver && this.scorebar.players!==1;
    }

    resetSelected() {
        // this has a bug if user moves more than one tile
        this.block_gpos_updates = true;
        const sel = [];
        for (var i = 0; i < this.selection.length; i++) {
            var gp = this.selection[i];
            sel.push(this.getAtGpos(gp));
            this.deleteAtGpos(gp);
        }
        for (let t of sel) {
            if (t instanceof Tile && t.selected) {
                t.gpos = t.opos;
                t.selected = false;
                this.setAtGpos(t.gpos, t);
            }
        }
        this.block_gpos_updates = false;
        this.wordbar.word = '';
        this.wordbar.wordScore = 0;
        this.selection = [];
        this.candidates = [];
        this.updatePassBar();
    }

    getMoveCandidates(tile) {
        const candidates = [new eskv.Vec2(tile.gpos)];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        directions.forEach(direction => {
            let gp = new eskv.Vec2([tile.gpos[0] + direction[0], tile.gpos[1] + direction[1]]);
            while (gp[0] >= 0 && gp[0] < globals.boardDim && gp[1] >= 0 && gp[1] < globals.boardDim) {
                if (!this.tiles.has(this._conv_pos(gp))) { // Assuming `this.tiles` is an object storing the tiles
                    candidates.push(new eskv.Vec2(gp)); // Use slice to copy the array
                } else {
                    break;
                }
                gp = new eskv.Vec2([gp[0] + direction[0], gp[1] + direction[1]]);
            }
        });

        const selCandidates = this.getSelectionLineCandidates();
        if (selCandidates !== null) {
            const icandidates = candidates.filter(c => selCandidates.some(sc => sc[0] === c[0] && sc[1] === c[1]));
            return icandidates;
        } else {
            return candidates;
        }
    }

    getSelectionLineCandidates() {
        const candidates = [];
        if (this.selection.length === 0) {
            return null;
        }

        if (this.selection.length === 1) {
            const s = this.selection[0];
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            directions.forEach(direction => {
                let gp = [s[0] + direction[0], s[1] + direction[1]];
                while (gp[0] >= 0 && gp[0] < globals.boardDim && gp[1] >= 0 && gp[1] < globals.boardDim) {
                    candidates.push(gp.slice());
                    gp = [gp[0] + direction[0], gp[1] + direction[1]];
                }
            });
            return candidates;
        }

        if (this.selection.length >= 2) {
            const start = this.selection[0];
            const end = this.selection[this.selection.length - 1];
            const dx = Math.sign(end[0] - start[0]);
            const dy = Math.sign(end[1] - start[1]);
            const directionPairs = [[dx, dy], [-dx, -dy]];
            directionPairs.forEach(([dx, dy]) => {
                let gp = start.slice();
                while (gp[0] >= 0 && gp[0] < globals.boardDim && gp[1] >= 0 && gp[1] < globals.boardDim) {
                    candidates.push(gp.slice());
                    gp = [gp[0] + dx, gp[1] + dy];
                }
            });
            return candidates;
        }
        return null;
    }

    isSelectionAWord() {
        let hasMove = false;
        let sumValue = 0;
        let candidate = '';
        const sel = this.selection.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
        const start = sel[0];
        const end = sel[sel.length - 1];
        const dx = Math.sign(end[0] - start[0]);
        const dy = Math.sign(end[1] - start[1]);
    
        for (let i = 0; i < sel.length; i++) {
            const s = sel[i];
            if (s[0] !== start[0] + i * dx || s[1] !== start[1] + i * dy) {
                return { word: '', value: 0 };
            }
            const t = this.getAtGpos(s);
            if (t) {
                candidate += t.letter;
                sumValue += t.value;
                hasMove = hasMove || (t.gpos[0] !== t.opos[0] || t.gpos[1] !== t.opos[1]);    
            }
        }
    
        if (!hasMove) {
            return { word: '', value: 0 };
        }
    
        if (this.words.has(candidate)) {
            return { word: candidate, value: sumValue * candidate.length };
        }
    
        const reversedCandidate = candidate.split('').reverse().join('');
        if (this.words.has(reversedCandidate)) {
            return { word: reversedCandidate, value: sumValue * candidate.length };
        }
    
        return { word: '', value: 0 };
    }
    
    confirmWord(widget, touch) {
        if (!this.activePlayer.localTouch()) {
            return false;
        }
        if (!widget.collide(touch.rect)) {
            return false;
        }
        if (this.wordbar.wordScore===0 && !this.wordbar.canPass) {
            return false;
        }

        this.endTurn();
        return true;
    }
    
    endTurn() {
        const passTurn = this.selection.length === 0;
        const word = this.wordbar.word;
        const score = this.wordbar.wordScore;
    
        if (passTurn && this.wordbar.canPass) {
            this.consecutivePasses++;
        } else {
            this.consecutivePasses = 0;
        }
    
        if (this.scorebar.activePlayer === 1) {
            this.scorebar.score += this.wordbar.wordScore;
        } else {
            this.scorebar.score_2 += this.wordbar.wordScore;
        }
        
        this.wordbar.word = '';
        this.wordbar.wordScore = 0;
        this.selection.forEach(s => {
            const t = this.getAtGpos(s);
            this.deleteAtGpos(s);
            if (t) {
                t.selected = false;
                t.gpos = new eskv.Vec2([-1, -1]);    
            }
        });
        this.selection = [];
    
        if (this.scorebar.players === 2) {
            this.scoreDetail2p.add(this.players, this.scorebar.activePlayer, word, score);
        } else {
            this.scoreDetail1p.add(this.players, word, score);
        }
    
        if (this.consecutivePasses === this.scorebar.players) {
            this.gameOver = true;
            this.updatePassBar();
            this.scoreDetail1p.title = 'Game Over';
            this.scoreDetail2p.title = 'Game Over';
            this.showScoreSummary();
        } else {
            if (this.scorebar.players === 2) {
                this.scorebar.activePlayer = 3 - this.scorebar.activePlayer;
                this.activePlayer = this.players[this.scorebar.activePlayer];
            }
            this.updatePassBar();
            this.activePlayer.startTurn();
        }
    }
        
    onTouchScore(scoreBar, touch) {
        // Assuming collidePoint is a method to check if a touch event is within the scorebar area
        if (this.scorebar.collide(touch.rect)) {
            this.showScoreSummary();
            return true;
        }
        return false;
    }
        
    showScoreSummary() {
        if (this.overlayShowing()) {
            return;
        }
        if (Object.keys(this.players).length === 2) {
            this.scoreDetail2p.popup();
        } else {
            this.scoreDetail1p.popup();
        }
    }
        
    loadState() {
        const gameDataString = localStorage.getItem('SlideWordsApp/GameState');
        if (!gameDataString) {
            return false;
        }
        const game = JSON.parse(gameDataString);
        const gridData = game.gridData;
        if (gridData.length !== this.tileWidgets.length) {
            console.info('Bad game data');
            localStorage.removeItem('SlideWordsApp/GameState');
            return false;
        }
        console.info('Loading game data');

        try {
            this.scorebar.players = game.players;
        } catch (error) {
            this.scorebar.players = 1;
        }

        if (this.scorebar.players === 1) {
            this.selection = game['selection'];
            this.wordbar.wordScore = game['wordScore'];
            this.wordbar.word = game['word'];
            this.scorebar.setGameId(game['highScoreId']);
            this.scorebar.score = game['score'];
            this.scorebar.activePlayer = 1;
            this.players = {1: new Player(this, 1)};
            this.scoreDetail1p.setScoreData(game['scoreData'])
            // this.processSinglePlayerMode(game);
        } else {
            this.selection = []
            this.wordbar.wordScore = 0
            this.wordbar.word = ''
            this.scorebar.score = game['score']
            this.scorebar.score_2 = game['score_2']
            this.scorebar.activePlayer = game['activePlayer']
            const [p1type, p2type] = game['ptypes']
            this.players = {
                1: new playerTypes[p1type](this,1),
                2: new playerTypes[p2type](this,2),
            }
            this.scoreDetail2p.setScoreData(game['scoreData1'], game['scoreData2'])
            // this.processMultiPlayerMode(game);
        }

        this.blockGposUpdates = true;
        this.originalGps = game['originalGps'];
        this.tiles.clear();
        this.children = this.children.filter((widget)=>!(widget instanceof Tile));
        this.tileWidgets = [];
        for (const t of gridData) {
            const tile = new Tile(this, 0, 0, t.letter, t.value);
            this.addChild(tile);
            tile.gpos = new eskv.Vec2(t.gpos);
            tile.opos = new eskv.Vec2(t.opos);
            tile.cpos = new eskv.Vec2(t.cpos);
            tile.selected = t.selected;
            this.tileWidgets.push(tile);
            if (tile.gpos[0]!==-1 && tile.gpos[1]!==-1) {
                this.setAtGpos(t.gpos, tile);
            }
        }
        this.blockGposUpdates = false;
        this._needsLayout = true;

        this.activePlayer = this.players[this.scorebar.activePlayer];
        if (this.scorebar.players === 2) {
            this.activePlayer.startTurn();
        }

        return true;
    }
    
    saveState() {
        if (this.gameOver) {
            localStorage.removeItem('SlideWordsApp/GameState');
            return;
        }
    
        const gridData = this.tileWidgets.map(t => {
            return {
                letter: t.letter,
                value: t.value,
                selected: t.selected,
                gpos: Array.from(t.gpos),
                cpos: Array.from(t.cpos),
                opos: Array.from(t.opos),
            };
        });
    
        const version = 1.0;
        let data = {
            version: version,  // Assuming __version__ is defined somewhere globally or in this context
            gridData: gridData,
            originalGps: this.originalGps,
            selection: this.selection,
            word: this.wordbar.word,
            wordScore: this.wordbar.wordScore,
            players: this.scorebar.players,
            score: this.scorebar.score
        };
    
        if (this.scorebar.players === 1) {
            data.highScoreId = this.scorebar.gameId;
            data.scoreData = this.scoreDetail1p.scoreData;
        } else {
            data.activePlayer = this.scorebar.activePlayer;
            data.score_2 = this.scorebar.score_2;
            data.scoreData1 = this.scoreDetail2p.scoreData1;
            data.scoreData2 = this.scoreDetail2p.scoreData2;
            data.ptypes = [this.players[1].type, this.players[2].type];
        }
    
        localStorage.setItem('SlideWordsApp/GameState', JSON.stringify(data));
        console.log('Saved game data'); // Logger.info equivalent in JavaScript
    }
}

class Instructions extends eskv.ModalView {
    constructor(props={}) {
        super(); 
        this.mScrollView = null; 
        this.updateProperties(props);
    }
}

eskv.App.registerClass('Instructions', Instructions, 'ModalView');

class ScoreDetail1p extends eskv.ModalView {
    constructor() {
        super();
        this.updateProperties({});
        this.reset();
    }

    reset(players) {
        this.scoreData = [];
        this.title = 'Start of the Game';
        this.detail = 'SCORE: 0';
    }

    setScoreData(players, scoreData) {
        this.scoreData = scoreData;
        this.updateText(players);
    }

    add(players, word, score) {
        if (word === '' && score === 0) {
            word = '<PASS>';
        }
        this.scoreData.push([word, score]);
        this.updateText(players);
    }

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


class ScoreDetail2p extends eskv.ModalView {
    constructor() {
        super();
        this.updateProperties({});
        this.reset({});
    }

    reset(players) {
        this.scoreData1 = [];
        this.scoreData2 = [];
        this.title = 'Start of the Game';
        const pname1 = (1 in players) ? players[1].name !== 'HUMAN' ? players[1].name : 'PLAYER 1' : 'UNKNOWN';
        this.detail1 = `${pname1}: 0`;
        const pname2 = (2 in players) ? players[2].name !== 'HUMAN' ? players[2].name : 'PLAYER 2' : 'UNKNOWN';
        this.detail2 = `${pname2}: 0`;    
    }

    setScoreData(players, scoreData1, scoreData2) {
        this.scoreData1 = scoreData1;
        this.scoreData2 = scoreData2;
        this.updateText(players);
    }

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


class Menu extends eskv.ModalView {
    constructor(props={}) {
        super();
        this.selection = '';
        this.updateProperties(props);
    }
}

eskv.App.registerClass('Menu', Menu, 'ModalView');

class MultiplayerMenu extends eskv.ModalView {
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


class LeaderboardMenu extends eskv.ModalView {
    constructor() {
        super();
        this.selection = ''; // Similar to NumericProperty
        // Assuming playerTypes is a structured object with names as in the MultiplayerMenu class
        this.players = ['', 'Player 1', 'Player 2'];
        this.updateProperties({});
    }
}

eskv.App.registerClass('LeaderboardMenu', LeaderboardMenu, 'ModalView');


class ScoreBar extends eskv.BoxLayout {
    constructor(props={}) {
        super();
        this.score = 0;
        this.score_2 = 0;
        this.hiScore = 0;
        this.gameId = '';
        this.players = 0;
        this.activePlayer = 0;
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
        this.players = (multiplayer ? 1 : 0) + 1;
        this.activePlayer = 1;
        this.gameId = gameId;
        if (this.players === 1) {
            const data = this.store[this.gameId];
            this.hiScore = data ? data.highScore : 0;
        }
    }

    scoreChanged() {
        if (this.players === 2) return;
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

class WordBar extends eskv.BoxLayout {
    word = '';
    wordScore = 0;
    canPass = false;
    constructor(props = {}) {
        super();
        if(props) this.updateProperties(props);
        this.wWordLabel = this.findById('wordLabel');  
    }
}

eskv.App.registerClass('WordBar', WordBar, 'BoxLayout')


class MessageBar extends eskv.BoxLayout {
    constructor(props = {}) {
        super();
        this.message = '';  // Equivalent to StringProperty
        this.updateProperties(props);
    }

    activePlayerChanged(scoreBar, activePlayer) {
        if (scoreBar.players === 2) {
            this.message = `PLAYER ${scoreBar.activePlayer}'S TURN`;
        }
    }

    gameOver(board, gameOver) {
        if (gameOver) {
            if (board.scorebar.players === 2) {
                if (board.scorebar.score_2 === board.scorebar.score) {
                    this.message = 'DRAW!'                    
                } else {
                    const winner = board.scorebar.score_2 > board.scorebar.score ? 2:1;
                    if (board.players[winner].type === 1) {
                        this.message = `PLAYER ${winner} WINS!`;
                    } else {
                        this.message = `${board.players[winner].name} WINS!`;
                    }    
                }
            } else {
                this.message = 'GAME OVER';
            }
        } else {
            this.message = '';
        }
    }

    gameChanged(scoreBar, gameId) {
        if (scoreBar.players === 2) return;
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
                    setTimeout(() => this.onDailyChallengeTimer(gameId), hours * 3600000);
                } else if (minutes > 0) {
                    this.message = `${minutes} MINUTE${minutes > 1 ? 'S' : ''} LEFT`;
                    setTimeout(() => this.onDailyChallengeTimer(gameId), minutes * 60000);
                } else {
                    this.message = `${seconds} SECOND${seconds > 1 ? 'S' : ''} LEFT`;
                    setTimeout(() => this.onDailyChallengeTimer(gameId), seconds * 1000);
                }
            } else {
                this.message = 'THE DAILY CHALLENGE HAS EXPIRED';
            }
        } else {
            this.message = '';
        }
    }

    onDailyChallengeTimer(gameId) {
        if (gameId === this.gameId) {
            this.gameChanged(null, gameId);
        }
    }
}

eskv.App.registerClass('MessageBar', MessageBar, 'BoxLayout');

class SlideWordsApp extends eskv.App {
    prefDimH = 14;
    prefDimW = 10;
    constructor(props={}) {
        super();
        const markupObjects = eskv.markup.parse(markup);
        this.updateProperties(props)
        /**@type {Map<string, string>} */
        this.config = new Map();
        this.colors = {};
        this.words = words;
        try {
            this.colors = colors.loadTheme(this.config.get('theme')??'default');
        } catch (error) {
            this.colors = colors.loadTheme('default');
        }
        eskv.App.resources['colors'] = this.colors;
        this.gb = new Board(words);
        this.baseWidget.addChild(this.gb);
    }
    static get() {
        if(!eskv.App.appInstance) eskv.App.appInstance = new SlideWordsApp();
        return eskv.App.appInstance;
    }
    setNextTheme() {
        const themes = Object.keys(colors.themes);
        const currentTheme = this.config.get('theme')??'theme';
        const ind = themes.indexOf(currentTheme);
        const newTheme = themes[(ind + 1) % themes.length];
        localStorage.setItem('SlideWords/theme', newTheme);
        this.colors = colors.loadTheme(newTheme);
        eskv.App.resources['colors'] = this.colors;
    }

    buildConfig(config) {
        config.setDefaults('theme', { 'theme': 'beach' });
    }

    on_key_down(event, object, keyInfo) {
        if('Escape' in keyInfo.states && keyInfo.states['Escape']) {
            if(!this.gb) return;
            if (this.gb.scoreDetail1p.visible) {
                this.gb.scoreDetail1p.close();
            } else if (this.gb.scoreDetail2p.visible) {
                this.gb.scoreDetail2p.close();
            } else if (this.gb.instructions.visible) {
                this.gb.instructions.close();
            } else if (this.gb.multiplayerMenu.visible) {
                this.gb.multiplayerMenu.close();
            } else if (this.gb.leaderboardMenu.visible) {
                this.gb.leaderboardMenu.close();
            } else if (!this.gb.menu.visible) {
                this.gb.showMenu();
            } else {
                this.gb.hideMenu();
            }
            return true;
        }
        return false;
    }

    onStop() {
        if(!this.gb) return;
        this.gb.saveState();
        if (this.gb.activePlayer) {
            this.gb.activePlayer.abort();
        }
    }
}

/**@type {Set<string>} */
export var words;
loadWords(urlWords).then((result)=>{
    words = result;
    SlideWordsApp.get().start();    
});

