//@ts-check
import * as globals from './globals.js';
import { SlideWordsApp } from './app.js';

//@ts-ignore
import urlWords from './TWL06.txt?url';

globals.loadWords(urlWords).then((result)=>{
    if (result) {
        new SlideWordsApp().start();    
    }
});

