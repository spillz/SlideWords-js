//@ts-check

export const boardDim = 10

//Letter, Value, Number of Tiles
/**@type {[string,number,number][]} */
export const tiles = [
['A', 0, 7],
['B', 2, 3],
['C', 2, 3],
['D', 1, 5],
['E', 0, 10],
['F', 2, 3],
['G', 2, 4],
['H', 3, 2],
['I', 0, 7],
['J', 4, 1],
['K', 3, 2],
['L', 0, 4],
['M', 2, 3],
['N', 1, 4],
['O', 0, 7],
['P', 2, 3],
['Q', 4, 1],
['R', 1, 5],
['S', 1, 5],
['T', 1, 5],
['U', 1, 4],
['V', 4, 1],
['W', 3, 3],
['X', 4, 1],
['Y', 3, 2],
['Z', 4, 1],
]

/**@type {Set<string>} */
export var words = new Set();

export async function loadWords(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        words = new Set(text.split('\n'));
        return true;
    } catch (err) {
        console.error(`Error loading file: ${url}`, err);
        throw false;
    }
    return false
}
