import {Settings} from "./settings.js";
import {EditingDialogue} from "./EditingDialogue.js";

Hooks.once('init', async function () {
    Settings.registerSettings()
});

Hooks.once('ready', async function () {
    await EditingDialogue.loadTranslations()
});
