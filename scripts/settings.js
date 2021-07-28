import {EditingDialogue} from "./EditingDialogue.js";

const MODULE_ID = 'translation-editor'
const MENU_ID = 'te-menu'
const TRANSLATION = {
    DIALOGUE: {
        title: `${MODULE_ID}.dialogue.title`
    }
}

export class Settings {
    static registerSettings() {
        game.settings.registerMenu(MODULE_ID, MENU_ID, {
            name      : game.i18n.localize(`${MODULE_ID}.config.button`),
            label     : game.i18n.localize(`${MODULE_ID}.config.label`),
            hint      : game.i18n.localize(`${MODULE_ID}.config.hint`),
            icon      : "fas fa-pencil",
            type      : EditingDialogue,
            restricted: true
        })
    }
}

export {
    MODULE_ID,
    TRANSLATION
}
