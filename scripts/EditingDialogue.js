import {MODULE_ID, TRANSLATION} from "./settings.js"

export class EditingDialogue extends FormApplication {

    static TRANSLATIONS = {}

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
        options.width = 600
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
     * @param {Object} module
     * @returns {[{string: {translations: {language: string, text: string}}}, int]}
     */
    static async loadTranslationsForModule(module) {
        console.log(`Loading translations for ${module.data.name}.`)
        const languages = module.languages
        let out = {}
        if (languages.length > 0) {
            await this.asyncForEach(languages, async (language) => {
                console.log(`Current language key: ${language.lang}`)
                let request = await fetch(language.path)
                let languageData = await request.json()
                console.log(languageData)
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
                        name:         module.data.title,
                        languages:    languages,
                        translations: translationsForModule
                    }
                }
            }
        }))
    }

    static async displayTranslationsForModule(moduleId) {
        const data = this.TRANSLATIONS[moduleId]
        if (!data) {
            console.error(`Tried to fetch translations for unknown moduleId ${moduleId}.`)
            return
        }
        const languages = data.languages
        console.log(`Translation data for module ${moduleId}.`)
        let tableHead = '<tr>'
        tableHead += '<th>Key</th>'
        for (let language in languages) {
            if (!languages.hasOwnProperty(language)) {
                continue
            }
            tableHead += `<th>${languages[language].name}</th>`
        }
        tableHead += '</tr>'
        console.log(`Table Head Content: ${tableHead}`)

        let tableBody = ''
        let translationData = data.translations
        for (let translationKey in translationData) {
            if (!translationData.hasOwnProperty(translationKey)) {
                continue
            }
            let translations = translationData[translationKey].translations
            tableBody += '<tr>'
            tableBody += `<td>${translationKey}</td>`
            for (let i = 0; i < languages.length; i++) {
                let currentLanguageIdentifier = languages[i].lang
                if (translations.hasOwnProperty(currentLanguageIdentifier)) {
                    tableBody += `<td>${translations[currentLanguageIdentifier]}</td>`
                } else {
                    tableBody += '<td></td>'
                }
            }
            tableBody += '</tr>'
        }
        console.log(`Table Body Content: ${tableBody}`)

        let table = $('#te-form table')
        table.find('> thead').html(tableHead)
        table.find('> tbody').html(tableBody)
        console.log('Finished updating table.')
    }

    toggleSelect() {
        const editor = $('#translation-editor-editor')
        const select = editor.find('select.moduleList')
        const loadingIcon = editor.find('i.loadingIcon')
        if (select.hasClass("disabled")) {
            select.removeClass('disabled').attr('disabled', false)
            loadingIcon.addClass('hidden')
        }
        else {
            select.addClass('disabled').attr('disabled', true)
            loadingIcon.removeClass('hidden')
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        $('#translation-editor-editor').find('select.moduleList').on('change', async function () {
            await EditingDialogue.displayTranslationsForModule($(this).val())
        })
    }

}
