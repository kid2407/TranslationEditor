import { EditingDialogue } from './EditingDialogue.js';
import { DEBUG_ACTIVE, MODULE_ID, registerSettings } from './settings.js';
import { logger } from './Logger.js';

Hooks.once('init', async function () {
  game.translationEditor = {};

  registerSettings();
});

Hooks.once('ready', async function () {
  logger.debugEnabled = game.settings.get(MODULE_ID, DEBUG_ACTIVE);
  game.translationEditor.dialog = new EditingDialogue();

  await game.translationEditor.dialog.loadTranslations();
});
