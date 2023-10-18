import { MODULE_ID, TRANSLATION } from './settings.js';
import { logger } from './Logger.js';

export class EditingDialogue extends FormApplication {
  /** @var {{string: {name: string, languages: {lang: string, name: string, path: string}[], translations: {string: {translations: {}}}}}} TRANSLATIONS */
  TRANSLATIONS = {};

  get title() {
    return game.i18n.localize(TRANSLATION.DIALOGUE.title);
  }

  async _updateObject(event, formData) {
    return Promise.resolve(undefined);
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = `${MODULE_ID}-editor`;
    options.template = `modules/${MODULE_ID}/templates/editor.hbs`;
    options.width = 1000;
    options.height = 500;
    options.resizable = true;

    return options;
  }

  getData(options = {}) {
    return {
      'modules': this.TRANSLATIONS,
    };
  }

  /**
   * Change the state of the module select and the loading icon.
   */
  toggleSelect() {
    const editor = $('#translation-editor-editor');
    const select = editor.find('select.moduleList');
    const loadingIcon = editor.find('i.loadingIcon');

    if (select.hasClass('disabled')) {
      select.removeClass('disabled').attr('disabled', false);
      loadingIcon.addClass('hidden');
      editor.find('table').removeClass('hidden');
    } else {
      select.addClass('disabled').attr('disabled', true);
      loadingIcon.removeClass('hidden');
    }
  }

  async loadTranslationsForModule(module) {
    if (module.processed) {
      return;
    }

    logger.info(`Loading translations for ${module.id}.`);
    const languages = module.languages;

    for (const language of languages.values()) {
      const request = await fetch(language.path);
      const jsonData = await request.json();

      const languageData = foundry.utils.flattenObject(jsonData);
      logger.debug(languageData);

      for (const [key, value] of Object.entries(languageData)) {
        if (!module.translations[key]) {
          module.translations[key] = {};
        }

        module.translations[key][language.lang] = value;
      }
    }

    module.processed = true;
  }

  async loadTranslations() {
    game.modules.forEach((async (module) => {
      if (module.active) {
        this.TRANSLATIONS[module.id] = {
          name: module.title,
          languages: module.languages,
          translations: {},
          processed: false,
        };
      }
    }));
  }

  async displayTranslationsForModule(moduleId) {
    logger.info(`Loading translation data for module ${moduleId}.`);
    const form = $('#te-form');
    this.toggleSelect();
    const data = this.TRANSLATIONS[moduleId];

    if (!data) {
      logger.error(`Tried to fetch translations for unknown moduleId ${moduleId}.`);
      this.toggleSelect();
      form.data('unsavedData', false);

      return;
    }

    try {
      await this.loadTranslationsForModule(data);
    } catch (err) {
      logger.error(`Can not load translations for module ${moduleId}: ${err}.`);
      this.toggleSelect();
      form.data('unsavedData', false);

      let uiError = game.i18n.format('translation-editor.errors.cantLoadTranslations', { name: data.name });

      if (err.toLocaleString().startsWith('SyntaxError:')) {
        uiError += ' ' + game.i18n.localize('translation-editor.errors.cantLoadTranslationsSyntaxError');
      }

      ui.notifications.error(uiError);

      return;
    }

    const languages = [...data.languages];
    let fromLanguage = '', toLanguage = '';
    const systemLanguage = game.i18n.lang;

    const fromLanguageSelect = $('#te-fromLanguage');
    const toLanguageSelect = $('#te-toLanguage');
    fromLanguageSelect.empty();
    toLanguageSelect.empty();

    for (const language of languages) {
      if (language.lang === systemLanguage) {
        fromLanguage = language;
      }

      fromLanguageSelect.append(`<option value="${language.lang}">${language.name}</option>`);
      toLanguageSelect.append(`<option value="${language.lang}">${language.name}</option>`);
    }

    if (fromLanguage.length === 0) {
      fromLanguage = languages[0];
      toLanguage = languages.length > 1 ? languages[1] : languages[0];
    } else {
      toLanguage = languages.length > 1 ? (languages[0].lang !== fromLanguage.lang ? languages[0] : languages[1]) : fromLanguage;
    }

    fromLanguageSelect.val(fromLanguage.lang);
    toLanguageSelect.val(toLanguage.lang);

    let tableHead = '<tr>';
    tableHead += `<th>${game.i18n.localize(TRANSLATION.CONFIG.editor['translation-key'])}</th>`;
    tableHead += `<th>${languages.filter(l => l.lang === fromLanguage.lang)[0].name}</th>`;
    tableHead += `<th>${languages.filter(l => l.lang === toLanguage.lang)[0].name}</th>`;
    tableHead += '</tr>';

    let tableBody = '';

    for (const [translationKey, translations] of Object.entries(data.translations)) {
      tableBody += `<tr data-translationkey="${translationKey}">`;
      tableBody += `<td>${translationKey}</td>`;

      if (translations[fromLanguage.lang]) {
        tableBody += `<td>
  <span class="fromText">${translations[fromLanguage.lang]}</span>
  <span class="characterCount">(${translations[fromLanguage.lang].length ?? 0})</span>
</td>`;
      } else {
        tableBody += '<td><span class="fromText"></span><span class="characterCount">(0)</span></td>';
      }

      if (translations[toLanguage.lang]) {
        tableBody += `<td>
  <textarea>${translations[toLanguage.lang]}</textarea>
  <span class="characterCount">(${translations[toLanguage.lang].length ?? 0})</span>
</td>`;
      } else {
        tableBody += '<td><textarea></textarea><span class="characterCount">(0)</span></td>';
      }

      tableBody += '</tr>';
    }

    const table = $('#te-form table');
    table.find('> thead').html(tableHead);
    table.find('> tbody').html(tableBody);

    logger.info('Finished updating table.');
    this.toggleSelect();
    form.data('unsavedData', false);
  }

  async reloadLanguage(type) {
    $('#te-form').data('unsavedData', false);
    const moduleId = $('select.moduleList').val();

    if (!moduleId) {
      logger.error('Could not get selected moduleId from select!');

      return;
    }

    let select, column;

    if (type === 'from') {
      select = $('select#te-fromLanguage');
      column = 2;
    } else if (type === 'to') {
      select = $('select#te-toLanguage');
      column = 3;
    } else {
      logger.error('Could not determine the selected language!');

      return;
    }

    const languageKey = select.val();
    if (!languageKey) {
      logger.error('Could not get selected language from select!');
      return;
    }

    const tableBody = $('#te-form > table > tbody');
    const translationsForModule = this.TRANSLATIONS[moduleId].translations;
    let cell, textInLanguage;

    for (const [translationsKey, translations] of Object.entries(translationsForModule)) {
      cell = tableBody.find(`> tr[data-translationkey="${translationsKey}"] > td:nth-of-type(${column})`);

      if (translations[languageKey]) {
        textInLanguage = translations[languageKey];
      } else {
        textInLanguage = '';
      }

      if (type === 'to') {
        cell.find('> textarea').val(textInLanguage);
      } else {
        cell.find('span').text(textInLanguage);
      }

      cell.find('> span.characterCount').html(`(${textInLanguage.length})`);
      logger.debug(translations);
    }
  }

  async filterTranslations(searchTerm) {
    searchTerm = searchTerm.trim().toLowerCase();
    $('#te-form table tbody > tr').each((_, row) => {
      const textInRow = $(row).text().toLowerCase();

      if (textInRow.indexOf(searchTerm) > -1) {
        $(row).removeClass('hidden');
      } else {
        $(row).addClass('hidden');
      }
    });
  }

  /**
   * @param {File} file
   * @param {string} moduleId
   * @returns {Promise<void>}
   */
  async saveToFile(file, moduleId) {
    const filePath = `translation-files/${moduleId}`;

    try {
      await FilePicker.createDirectory('data', 'translation-files');
      await FilePicker.createDirectory('data', filePath);

      await FilePicker.upload('data', filePath, file);
    } catch (e) {
      if (!e.toString().startsWith('EEXIST')) {
        console.error(e);
      }

      ui.notifications.error(`Error while saving the file to ${filePath}`);
      logger.error(e);
    }
  }

  /**
   * @param {boolean} isDownload
   * @returns {Promise<void>}
   */
  async saveTranslations(isDownload = false) {
    const moduleId = $('select.moduleList').val();
    const targetLanguage = $('#te-toLanguage').val();
    const saveNested = $('select#te-saveType').val() === 'nested';
    const rawData = $('#te-form tbody > tr > td:nth-of-type(3) > textarea');
    const dataAsObject = {};

    logger.info(`Saving translations for module ${moduleId} in language ${targetLanguage}`);

    rawData.each((_, textarea) => {
      dataAsObject[$(textarea).parent().parent().data('translationkey')] = textarea.value;
    });

    let finalData;

    if (saveNested) {
      finalData = foundry.utils.expandObject(dataAsObject);
    } else {
      finalData = dataAsObject;
    }

    logger.info('Finalized the data to be saved');
    logger.debug(finalData);

    const languages = [...this.TRANSLATIONS[moduleId].languages];
    const targetLanguageData = languages.find(l => l.lang === targetLanguage);

    if (targetLanguageData) {
      const fileContent = JSON.stringify(finalData, null, 2);

      if (isDownload) {
        saveDataToFile(fileContent, 'text/json', `${moduleId}-${targetLanguage}.json`);
      } else {
        const file = new File(
          [new Blob([fileContent], { type: 'application/json' })],
          `${targetLanguage}.json`,
          { type: 'application/json' },
        );

        await this.saveToFile(file, moduleId);
      }
    }
  }

  /**
   * @param {function} accept
   * @param {function} reject
   */
  warnForUnsavedChanges(accept, reject = () => {
  }) {
    Dialog.confirm({
      title: game.i18n.localize(TRANSLATION.CONFIG.editor['unsaved-changes'].question),
      content: game.i18n.localize(TRANSLATION.CONFIG.editor['unsaved-changes'].text),
      yes: accept,
      no: reject,
      rejectClose: true,
    }).then();
  }

  activateListeners(html) {
    super.activateListeners(html);

    const instance = this;
    const moduleSelect = $('#translation-editor-editor').find('select.moduleList');
    const form = $('#te-form');
    form.data('unsavedData', false);

    moduleSelect.on('change', async function () {
      if (form.data('unsavedData')) {
        instance.warnForUnsavedChanges(() => {
          instance.displayTranslationsForModule($(this).val()).then();
        }, () => {
          moduleSelect.val(moduleSelect.find('option:selected').val());
        });
      } else {
        await instance.displayTranslationsForModule($(this).val());

        form.data('unsavedData', false);
      }
    });

    html.find('select#te-fromLanguage').on('change', async function () {
      if (form.data('unsavedData')) {
        instance.warnForUnsavedChanges(() => {
          instance.reloadLanguage('from').then();
        }, async () => {
          $(this).val($(this).find('option:selected').val());
        });
      } else {
        await instance.reloadLanguage('from');

        form.data('unsavedData', false);
      }
    });

    html.find('select#te-toLanguage').on('change', async function () {
      if (form.data('unsavedData')) {
        instance.warnForUnsavedChanges(() => {
          instance.reloadLanguage('to').then();
        }, async () => {
          $(this).val($(this).find('option:selected').val());
        });
      } else {
        await instance.reloadLanguage('to');
      }
    });

    html.find('table > tbody').on('keyup', '> tr > td > textarea', function () {
      $(this).find('+ span.characterCount').html(`(${$(this).val().length})`);
      form.data('unsavedData', true);
    });

    html.find('button.resetButton').on('click', async function (event) {
      event.preventDefault();

      if (form.data('unsavedData')) {
        instance.warnForUnsavedChanges(() => {
          instance.reloadLanguage('from').then();
          instance.reloadLanguage('to').then();
        });
      } else {
        await instance.displayTranslationsForModule(moduleSelect.val());
      }
    });

    html.find('button.saveButton').on('click', async function (event) {
      event.preventDefault();

      await instance.saveTranslations();
    });

    html.find('button.downloadButton').on('click', async function (event) {
      event.preventDefault();

      await instance.saveTranslations(true);
    });

    html.find('input#te-search').on('keyup', async function () {
      await instance.filterTranslations($(this).val());
    });

    instance.displayTranslationsForModule(moduleSelect.val()).then();
  }
}
