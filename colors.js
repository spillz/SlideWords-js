//@ts-check

/**@typedef {string} ColorNum*/

/**@typedef {{background:ColorNum, tile:ColorNum, tile_selected:ColorNum, tile_letter_text:ColorNum, word_score_background:ColorNum, word_score_text:ColorNum, score_text:ColorNum, active_score_text:ColorNum, checker:ColorNum, move_candidates:ColorNum, menu_button_background:ColorNum, menu_button_touched:ColorNum }} Theme */


const c = (col) => [Math.floor(255 * col[0]), Math.floor(255 * col[1]), Math.floor(255 * col[2]), col[3]];
const s = (col) => `rgba(${col[0]},${col[1]},${col[2]},${col[3]})`

/**@type {Theme} */
const default_theme = {
    'background': s(c([0.7, 0.7, 0.9, 1])),
    'tile': s(c([0.5, 0.5, 0.75, 1])),
    'tile_selected': s(c([0, 0, 0.5, 1])),
    'tile_letter_text': s(c([0.9, 0.9, 0.9, 1])),
    'word_score_background': s(c([0, 0, 0.5, 1])),
    'word_score_text': s(c([0.9, 0.9, 0.9, 1])),
    'score_text': s(c([0.9, 0.9, 0.9, 1])),
    'active_score_text': s(c([0.5, 0.5, 0.75, 1])),
    'checker': s(c([0.8, 0.8, 0.9, 1])),
    'move_candidates': s(c([0.2, 0.3, 0.7, 1])),
    'menu_button_background': s(c([0.5, 0.8, 0.7, 1])),
    'menu_button_touched': s(c([0.7, 0.8, 0.9, 1])),
    }

/**@type {Theme} */
const beach_theme = {
    'background': s([20,140,156,1]),
    'tile': s([255,241,156,1]),
    'tile_selected': s([232, 180, 120, 1]),
    'tile_letter_text': s([86, 148, 155, 1]),
    'word_score_background': s([252, 200, 130, 1]),
    'word_score_text': s([86, 148, 155, 1]),
    'score_text': s([221, 238, 242, 1]),
    'active_score_text': s([254, 241, 156, 1]),
    'checker': s([0, 202, 199, 1]),
    'move_candidates': s([252, 200, 130, 1]),
    'menu_button_background': s([252, 136, 61, 1]),
    'menu_button_touched': s([252, 157, 84, 1]),
    }

/**@type {Object<string, Theme>} */
export const themes = {
    'default': default_theme,
    'beach' : beach_theme
    }
