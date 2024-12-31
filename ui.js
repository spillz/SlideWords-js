//@ts-check
import * as eskv from '../eskv/lib/eskv.js';

class TextButton extends eskv.Button {
    color = 'rgba(255,255,255,1)';
    background_color = 'rgba(0xbb, 0xad, oxa0, 1)';
    // hints = {h:0};
    // height = '48dp';
    // font_size = '20dp';
    // bold = true;
}


class ScoreBar extends eskv.BoxLayout {
    score = 0;
    hi_score = 0;
    score_2 = 0;
    players = 1;
    active_player = 1;
    game_id = '';
    orientation = 'horizontal';
    BoxLayout:
        orientation: 'vertical'
        Label:
            hints: {w:1, h:0.33}
            text: root.players == 1?'SCORE' : 'PLAYER 1'
            color: root.active_player == 2 || root.players == 1? app.colors['score_text'] : app.colors['active_score_text']
            font_size: this.size[1]/1.2
            text_size: this.size
            halign: 'left'
            valign: 'bottom'
        Label:
            hints: {w:1, h:0.67}
            text: str(root.score)
            color: root.active_player == 2 || root.players == 1? app.colors['score_text'] : app.colors['active_score_text']
            font_size: this.size[1]/1.2
            text_size: this.size
            halign: 'left'
            valign: 'top'
    BoxLayout:
        orientation: 'vertical'
        Label:
            text: 'MULTIPLAYER' if root.players == 2 else 'DAILY CHALLENGE' if root.game_id is not 'default' else 'RANDOM GAME'
            color: app.colors['score_text']
            font_size: this.size[1]/1.2/3
            text_size: this.size
            halign: 'center'
            valign: 'top'
    BoxLayout:
        orientation: 'vertical'
        Label:
            hints: {w:1, h:0.33}
            text: 'BEST' if root.players == 1 else 'PLAYER 2'
            color: app.colors['score_text'] if (root.active_player == 1 or root.players == 1) else app.colors['active_score_text']
            font_size: this.size[1]/1.2
            text_size: this.size
            halign: 'right'
            valign: 'bottom'
        Label:
            hints: {w:1, h:0.67}
            text: str(root.hi_score if root.players == 1 else root.score_2)
            color: app.colors['score_text'] if (root.active_player == 1 or root.players == 1) else app.colors['active_score_text']
            font_size: this.size[1]/1.2
            text_size: this.size
            halign: 'right'
            valign: 'top'

}

class WordBar extends eskv.BoxLayout {
    size_hint = (None, None);
    orientation = 'vertical';
    w_word_label = word_label;
    word = '';
    word_score = 0;
    can_pass = True;
    // canvas.before:
    //     Color:
    //         rgba: app.colors['word_score_background'] if root.word!='' or root.can_pass else app.colors['background']
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    constructor(props = {}) {
        super(props);
        this.children = [
            new BoxLayout({
                orientation: 'horizontal',
                children: [
                    Label:
                    id: word_label
                    text: '%s for %i'%(root.word, root.word_score) if root.word!='' else 'PASS' if root.can_pass else ''
                    font_size: root.size[1]/1.5
                    color: app.colors['word_score_text']    
    
                ]
            })
        ]

    }
}

class MessageBar extends eskv.BoxLayout {
    size_hint = (None, None);
    orientation = 'vertical';
    message = '';
    constructor(props = {}) {
        super()
        this.updateProperties(props);
        this.children = [
            new eskv.Label({
                text: root.message,
                font_size: root.size[1]/1.5,
                color: app.colors['score_text'],
            });
        ]
    }
}


class MenuLabel extends eskv.Label {
    // canvas.before:
    //     Color:
    //         rgba: app.colors['menu_button_background']
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    // font_size: this.size[1]/2.0

}

class InstructionsBox extends eskv.BoxLayout {
    // canvas.before:
    //     Color:
    //         rgba: app.colors['checker']
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size

}

class InstructionsLabel extends eskv.Label {
    // canvas.before:
    //     Color:
    //         rgba: app.colors['checker']
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
}

class Instructions extends eskv.BoxLayout {
    m_scrollview = new eskv.ScrollView();
    // size_hint = (1, 1);
    orientation = 'vertical';
    padding = (0.1*this.size[0], 0.05*this.size[1]);
    spacing = int(0.01*this.size[0]);
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    constructor(props={}) {
        super();
        this.updateProperties(props);
        InstructionsLabel:
            left: 0.1*root.size[0]
            size_hint: (1,0.1)
            text: 'How to Play'
            text_size: (this.size[0]*0.9, this.size[1])
            font_size: '32dp'
            valign: 'middle'
            halign: 'center'
        ScrollView:
            id: scroller
            left: 0.1*root.size[0]
            size_hint: (1.0, 0.8)
            InstructionsLabel:
                size_hint_y: None
                height: max(this.texture_size[1], 0.8*root.size[1])
                text_size: 0.9*this.width, None
                text: 'Select letter tiles and drag at least one letter tile horizontally, diagonally, or vertically into free tile spaces to make a valid word. A word is valid if it is composed of connected letter tiles in a straight line (either vertically, horizontally or diagonally in either direction), is in the dictionary, and at least one tile was moved to form it. Score a valid word by pressing the word cue at bottom of the screen. Each word scores points equal to the sum of the tile values multiplied by the number of letters in the word. Cancel a selection by tapping any of the selected tiles.'
                halign: 'left'
                valign: 'middle'
                font_size: '20dp'

    }

}


class ScoreDetail1p extends eskv.BoxLayout {
    size_hint = (1, 1);
    orientation = 'vertical';
    padding = (0.1*this.size[0], 0.05*this.size[1]);
    spacing = int(0.01*this.size[0]);
    detail = '';
    title = 'In Progress';
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    InstructionsLabel:
        left: 0.1*root.size[0]
        size_hint: (1,None)
        text: root.title
        text_size: (this.size[0]*0.9, max(this.texture_size[1],this.size[1]))
        font_size: '32dp'
        valign: 'middle'
        halign: 'center'
    ScrollView:
        size_hint: (1.0, 0.8)
        padding: 0.1
        InstructionsLabel:
            size_hint_y: None
            height: max(this.texture_size[1],0.8*root.size[1])
            text_size: 0.9*this.width, max(this.texture_size[1], this.size[1])
            text: root.detail
            halign: 'left'
            valign: 'top'
            font_size: '18dp'
}

class ScoreDetail2p extends eskv.BoxLayout {
    size_hint = (1, 1);
    orientation = 'vertical';
    padding = (0.1*this.size[0], 0.05*this.size[1]);
    spacing = int(0.01*this.size[0]);
    detail1 = '';
    detail2 = '';
    title = 'In Progress';
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    InstructionsLabel:
        left: 0.1*root.size[0]
        size_hint: (1,0.1)
        text: root.title
        text_size: (this.size[0]*0.9, max(this.texture_size[1],this.size[1]))
        font_size: '32dp'
        valign: 'middle'
        halign: 'center'
    BoxLayout:
        orientation: 'horizontal'
        padding: 0.1
        spacing: 0.1
        ScrollView:
            size_hint: (0.35, 1)
            InstructionsLabel:
                size_hint_y: None
                height: max(this.texture_size[1],0.8*root.size[1])
                text_size: 0.9*this.width, max(this.texture_size[1], this.size[1])
                text: root.detail1
                halign: 'left'
                valign: 'top'
                font_size: '18dp'
        ScrollView:
            size_hint: (0.35, 1)
            InstructionsLabel:
                size_hint_y: None
                height: max(this.texture_size[1],0.8*root.size[1])
                text_size: 0.9*this.width, max(this.texture_size[1], this.size[1])
                text: root.detail2
                halign: 'right'
                valign: 'top'
                font_size: '18dp'
}

class Menu extends eskv.BoxLayout {
    size_hint = (None, None);
    orientation = 'vertical';
    hadj = max(0.1 * this.size[0], (this.size[0] - this.size[1])/2 + 0.1*this.size[0]);
    vadj = 0.15 * this.size[1];
    padding = [this.hadj, this.vadj];
    spacing = int(0.01*this.size[1]);
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    MenuLabel:
        text: 'Restart Game'
        value: 1
    MenuLabel:
        text: 'Random Game'
        value: 2
    MenuLabel:
        text: 'Daily Challenge'
        value: 3
    MenuLabel:
        text: 'Multiplayer'
        value: 4
    MenuLabel:
        text: 'Instructions'
        value: 5
    MenuLabel:
        text: 'Leaderboards'
        value: 6
    MenuLabel:
        text: 'Achievements'
        value: 7
    MenuLabel:
        text: 'Theme'
        value: 8
    MenuLabel:
        text: 'Quit'
        value: 9
}

class MultiplayerMenu extends eskv.ModalView {
    orientation = "vertical";
    hadj = max(0.1 * this.size[0], (this.size[0] - this.size[1])/2 + 0.1*this.size[0]);
    vadj = 0.15 * this.size[1];
    padding = [this.hadj, this.vadj];
    spacing = int(0.01*this.size[1]);
    player1 = 1;
    player2 = 1;
    players = ['','Human', 'AI'];
    constructor(props={}) {
        super()
        this.updateProperties(props);
        this.children = [
            new MenuLabel({
                text: 'Start Game',
                value: 10,
                hints: {h:0.1},
            })
            new MenuLabel({
                text: 'Start Game',
                value: 10,
                hints: {h:0.1},
            })
            new MenuLabel({
                text: 'Start Game',
                value: 10,
                hints: {h:0.1},
            })
        ];

    }
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
}

class LeaderboardMenu extends eskv.BoxLayout {
    size_hint = (None, None);
    orientation = 'vertical';
    hadj = max(0.1 * this.size[0], (this.size[0] - this.size[1])/2 + 0.1*this.size[0]);
    vadj = 0.15 * this.size[1];
    padding = [this.hadj, this.vadj];
    spacing = int(0.01*this.size[1]);
    // canvas.before:
    //     Color:
    //         rgba: [0,0,0,0.5]
    //     Rectangle:
    //         pos: this.pos
    //         size: this.size
    MenuLabel:
        text: 'High Score'
        value: 13
        size_hint_y: None
        height: root.size[1]*0.62/9
    MenuLabel:
        text: 'Daily Game High Score'
        value: 14
        size_hint_y: None
        height: root.size[1]*0.62/9
    MenuLabel:
        text: 'Number of 1,000+ Games'
        value: 15
        size_hint_y: None
        height: root.size[1]*0.62/9
}