//@ts-check
import * as eskv from '../eskv/lib/eskv.js';
import * as globals from './globals.js';
import * as colors from './colors.js';

import { Board } from './board.js';
//@ts-ignore
import markup from './slidewords.jkv?raw';

export class SlideWordsApp extends eskv.App {
    prefDimH = 14;
    prefDimW = 10;
    id = 'app';
    constructor(props={}) {
        super();
        try {
            this.colors = colors.themes[localStorage.getItem('SlideWords/theme')??'default'];
        } catch (error) {
            this.colors = colors.themes['default'];
        }
        // eskv.App.rules.add('Label', {fontName: "Arial, Helvetica, sans-serif"});
        eskv.App.rules.add('ScrollView', {uiZoom: false, scrollW: false});
        const markupObjects = eskv.markup.parse(markup);
        this.updateProperties(props)
        /**@type {Map<string, string>} */
        this.config = new Map();
        this.words = globals.words;
        this.gb = new Board(this.words);
        this.baseWidget.addChild(this.gb);
    }
    static get() {
        return /**@type {SlideWordsApp} */(eskv.App.get());
    }
    setNextTheme() {
        const themes = Object.keys(colors.themes);
        const currentTheme = localStorage.getItem('SlideWords/theme')??'default';
        const ind = themes.indexOf(currentTheme);
        const newTheme = ind>=0 ? themes[(ind + 1) % themes.length] : 'default';
        localStorage.setItem('SlideWords/theme', newTheme);
        this.colors = colors.themes[newTheme];
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
