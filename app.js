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
    constructor(props={}) {
        super();
        // eskv.App.rules.add('Label', {fontName: "Arial, Helvetica, sans-serif"});
        eskv.App.rules.add('ScrollView', {uiZoom: false, scrollW: false});
        const markupObjects = eskv.markup.parse(markup);
        this.updateProperties(props)
        /**@type {Map<string, string>} */
        this.config = new Map();
        this.colors = {};
        this.words = globals.words;
        try {
            this.colors = colors.loadTheme(this.config.get('theme')??'default');
        } catch (error) {
            this.colors = colors.loadTheme('default');
        }
        eskv.App.resources['colors'] = this.colors;
        this.gb = new Board(this.words);
        this.baseWidget.addChild(this.gb);
    }
    static get() {
        return /**@type {SlideWordsApp} */(eskv.App.get());
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
