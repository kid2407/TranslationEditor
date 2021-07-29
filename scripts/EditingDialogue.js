import {MODULE_ID, TRANSLATION} from "./settings.js"
import {logger} from "./Logger.js";

export class EditingDialogue extends FormApplication {

    static TRANSLATIONS = {}

    currentModuleLanguages = []

    get title() {
        return game.i18n.localize(TRANSLATION.DIALOGUE.title)
    }

    async _updateObject(event, formData) {
        return Promise.resolve(undefined)
    }

    static get defaultOptions() {
        const options = super.defaultOptions
        options.id = `${MODULE_ID}-editor`
        options.template = `modules/${MODULE_ID}/templates/editor.hbs`
        options.width = 1000
        options.height = 500
        options.resizable = true

        return options
    }

    // noinspection JSCheckFunctionSignatures
    getData(options = {}) {
        // noinspection JSValidateTypes
        return {
            "modules": EditingDialogue.TRANSLATIONS
        }
    }

    /**
     * Async for each loop
     *
     * @param  {array} array - Array to loop through
     * @param  {function} callback - Function to apply to each array item loop
     */
    static async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index += 1) {
            await callback(array[index], index, array)
        }
    }

    /**
     * Change the state of the module select and the loading icon.
     */
    static toggleSelect() {
        const editor = $('#translation-editor-editor')
        const select = editor.find('select.moduleList')
        const loadingIcon = editor.find('i.loadingIcon')
        if (select.hasClass("disabled")) {
            select.removeClass('disabled').attr('disabled', false)
            loadingIcon.addClass('hidden')
            editor.find('table').removeClass('hidden')
        } else {
            select.addClass('disabled').attr('disabled', true)
            loadingIcon.removeClass('hidden')
        }
    }


    /**
     * @param {Object} module
     * @returns {[{string: {translations: {language: string, text: string}}}, int]}
     */
    static async loadTranslationsForModule(module) {
        logger.info(`Loading translations for ${module.data.name}.`)
        const languages = module.languages
        let out = {}
        if (languages.length > 0) {
            await this.asyncForEach(languages, async (language) => {
                logger.debug(`Current language key: ${language.lang}`)
                let request = await fetch(language.path)
                let languageData = await request.json()
                logger.debug(languageData)
                for (let languageDataKey in languageData) {
                    if (!languageData.hasOwnProperty(languageDataKey)) {
                        continue
                    }
                    if (typeof out[languageDataKey] === "undefined") {
                        out[languageDataKey] = {
                            translations: {}
                        }
                    }
                    out[languageDataKey].translations[language.lang] = languageData[languageDataKey]
                }
            })
        }

        return [out, languages]
    }

    static async loadTranslations() {
        game.modules.forEach((async (module) => {
            if (module.active) {
                // noinspection ES6RedundantAwait
                let [translationsForModule, languages] = await EditingDialogue.loadTranslationsForModule(module)
                if (Object.keys(translationsForModule).length > 0) {
                    this.TRANSLATIONS[module.id] = {
                        name: module.data.title,
                        languages: languages,
                        translations: translationsForModule
                    }
                }
            }
        }))
    }

    async displayTranslationsForModule(moduleId) {
        logger.info(`Loading translation data for module ${moduleId}.`)
        EditingDialogue.toggleSelect()
        const data = EditingDialogue.TRANSLATIONS[moduleId]
        if (!data) {
            logger.error(`Tried to fetch translations for unknown moduleId ${moduleId}.`)
            EditingDialogue.toggleSelect()
            return
        }
        let languages = data.languages
        let fromLanguage, toLanguage = ''
        const systemLanguage = game.i18n.lang

        let fromLanguageSelect = $('#te-fromLanguage')
        let toLanguageSelect = $('#te-toLanguage')
        fromLanguageSelect.empty()
        toLanguageSelect.empty()

        for (let language in languages) {
            if (!languages.hasOwnProperty(language)) {
                continue
            }
            let languageData = languages[language]
            if (languageData.lang === systemLanguage) {
                fromLanguage =languageData
            }

            // noinspection JSCheckFunctionSignatures
            fromLanguageSelect.append(`<option value="${languageData.lang}">${languageData.name}</option>`)
            // noinspection JSCheckFunctionSignatures
            toLanguageSelect.append(`<option value="${languageData.lang}">${languageData.name}</option>`)
        }

        if (fromLanguage.length === 0) {
            fromLanguage = languages[0]
            toLanguage = languages.length > 1 ? languages[1] : languages[0]
        } else {
            toLanguage = languages.length > 1 ? (languages[0].lang !== fromLanguage.lang ? languages[0] : languages[1]) : fromLanguage
        }

        fromLanguageSelect.val(fromLanguage.lang)
        toLanguageSelect.val(toLanguage.lang)

        let tableHead = '<tr>'
        tableHead += '<th>Key</th>'
        tableHead += `<th>${languages.filter(l => l.lang === fromLanguage.lang)[0].name}</th>`
        tableHead += `<th>${languages.filter(l => l.lang === toLanguage.lang)[0].name}</th>`
        tableHead += '</tr>'
        logger.debug(`Table Head Content: ${tableHead}`)

        let tableBody = ''
        let translationData = data.translations
        const selectedModuleLanguages = [fromLanguage, toLanguage]
        for (let translationKey in translationData) {
            if (!translationData.hasOwnProperty(translationKey)) {
                continue
            }
            let translations = translationData[translationKey].translations
            tableBody += '<tr>'
            tableBody += `<td>${translationKey}</td>`
            for (let i = 0; i < selectedModuleLanguages.length; i++) {
                let currentLanguageIdentifier = selectedModuleLanguages[i].lang
                if (translations.hasOwnProperty(currentLanguageIdentifier)) {
                    tableBody += `<td>${translations[currentLanguageIdentifier]}</td>`
                } else {
                    tableBody += '<td></td>'
                }
            }
            tableBody += '</tr>'
        }
        logger.debug(`Table Body Content: ${tableBody}`)

        let table = $('#te-form table')
        table.find('> thead').html(tableHead)
        table.find('> tbody').html(tableBody)

        this.currentModuleLanguages = languages.map((l) => {
            l.fromLanguage = l.lang === fromLanguage.lang
            l.toLanguage = l.lang === toLanguage.lang
            return l
        })


        logger.info('Finished updating table.')
        EditingDialogue.toggleSelect()
    }

    activateListeners(html) {
        super.activateListeners(html)
        let instance = this
        let moduleSelect = $('#translation-editor-editor').find('select.moduleList')
        moduleSelect.on('change', async function () {
            await instance.displayTranslationsForModule($(this).val())
        })

        // noinspection JSIgnoredPromiseFromCall
        instance.displayTranslationsForModule(moduleSelect.val())
    }

}
