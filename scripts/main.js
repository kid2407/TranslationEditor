import { EditingDialogue } from './EditingDialogue.js';
import { DEBUG_ACTIVE, MODULE_ID, registerSettings } from './settings.js';
import { logger } from './Logger.js';

Hooks.once('init', async function () {
  registerSettings();
});

Hooks.once('ready', async function () {
  logger.debugEnabled = game.settings.get(MODULE_ID, DEBUG_ACTIVE);
  await EditingDialogue.loadTranslations();
});
