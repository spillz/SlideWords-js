//@ts-check

/**@typedef {[number, number, number, number]} ColorNum*/

/**@typedef {{background:ColorNum, tile:ColorNum, tile_selected:ColorNum, tile_letter_text:ColorNum, word_score_background:ColorNum, word_score_text:ColorNum, score_text:ColorNum, active_score_text:ColorNum, checker:ColorNum, move_candidates:ColorNum, menu_button_background:ColorNum, menu_button_touched:ColorNum }} Theme */

/**@type {Theme} */
const default_theme = {
    'background': [0.7, 0.7, 0.9, 1],
    'tile': [0.5, 0.5, 0.75, 1],
    'tile_selected': [0, 0, 0.5, 1],
    'tile_letter_text': [0.9, 0.9, 0.9, 1],
    'word_score_background': [0, 0, 0.5, 1], //(0, 0, 0.8, 1],
    'word_score_text': [0.9, 0.9, 0.9, 1], //(0.9, 0.9, 0.9, 1],
    'score_text': [0.9, 0.9, 0.9, 1],
    'active_score_text': [0.5, 0.5, 0.75, 1],
    'checker': [0.8, 0.8, 0.9, 1],
    'move_candidates': [0.2, 0.3, 0.7, 1],
    'menu_button_background': [0.5, 0.8, 0.7, 1],
    'menu_button_touched': [0.7, 0.8, 0.9, 1],
    }

/**@type {Theme} */
const beach_theme = {
    'background': [20,140,156,1],
    'tile': [255,241,156,1],
    'tile_selected': [232, 180, 120, 1],
    'tile_letter_text': [86, 148, 155, 1],
    'word_score_background' : [252, 200, 130, 1],
    'word_score_text': [86, 148, 155, 1],
    'score_text': [221, 238, 242, 1],
    'active_score_text': [254, 241, 156, 1],
    'checker': [0, 202, 199, 1],
    'move_candidates': [252, 200, 130, 1],
    'menu_button_background': [252, 136, 61, 1],
    'menu_button_touched': [252, 157, 84, 1],
    }

/**@type {Object<string, Theme>} */
export const themes = {
    'default': default_theme,
    'beach' : beach_theme
    }

export var background, tile, tile_selected, tile_letter_text, 
    word_score_background, word_score_text, score_text, 
    active_score_text, checker, moveCandidates, menu_button_background;

/**
 * Activate a specific theme
 * @param {string} themeName 
 */
export function loadTheme(themeName) {
    /**@type {Theme}*/
    const theme = themes[themeName];
    if (themeName === 'default') {
        const c = (col) => [Math.floor(255 * col[0]), Math.floor(255 * col[1]), Math.floor(255 * col[2]), col[3]];
        for (let k in theme) {
            theme[k] = c(theme[k]);
        }
    }

    for(let t in theme) {
        let [r,g,b,a] = theme[t];
        theme[t] = `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`;
    }
    theme['id'] = themeName;

    background = theme['background'];
    tile = theme['tile'];
    tile_selected = theme['tile_selected'];
    tile_letter_text = theme['tile_letter_text'];
    word_score_background = theme['word_score_background'];
    word_score_text = theme['word_score_text'];
    score_text = theme['score_text'];
    active_score_text = theme['active_score_text'];
    checker = theme['checker'];
    moveCandidates = theme['move_candidates'];
    menu_button_background = theme['menu_button_background'];
    return theme
}
