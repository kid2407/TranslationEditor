import { EditingDialogue } from './EditingDialogue.js';

const MODULE_ID = 'translation-editor';
const MENU_ID = 'te-menu';
const DEBUG_ACTIVE = 'te-debug';
const TRANSLATION = {
  DIALOGUE: {
    title: `${MODULE_ID}.dialogue.title`,
  },
  CONFIG: {
    'editor': {
      'button': `${MODULE_ID}.config.editor.button`,
      'hint': `${MODULE_ID}.config.editor.hint`,
      'label': `${MODULE_ID}.config.editor.label`,
      'translation-key': `${MODULE_ID}.config.editor.translation-key`,
      'unsaved-changes': {
        'question': `${MODULE_ID}.config.editor.unsaved-changes.question`,
        'text': `${MODULE_ID}.config.editor.unsaved-changes.text`,
      },
    },
    'debug': {
      'label': `${MODULE_ID}.config.debug.label`,
      'hint': `${MODULE_ID}.config.debug.hint`,
    },
  },
};

export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, MENU_ID, {
    name: game.i18n.localize(TRANSLATION.CONFIG.editor.button),
    label: game.i18n.localize(TRANSLATION.CONFIG.editor.label),
    hint: game.i18n.localize(TRANSLATION.CONFIG.editor.hint),
    icon: 'fas fa-pencil',
    type: EditingDialogue,
    restricted: true,
  });

  game.settings.register(MODULE_ID, DEBUG_ACTIVE, {
    name: game.i18n.localize(TRANSLATION.CONFIG.debug.label),
    hint: game.i18n.localize(TRANSLATION.CONFIG.debug.hint),
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      logger.debugEnabled = value;
    },
  });
}

export {
  MODULE_ID,
  TRANSLATION,
  DEBUG_ACTIVE,
};
