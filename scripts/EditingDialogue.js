import {MODULE_ID, TRANSLATION} from "./settings.js";

export class EditingDialogue extends FormApplication {

    static TRANSLATIONS = {}

    get title() {
        return game.i18n.localize(TRANSLATION.DIALOGUE.title)
    }

    async _updateObject(event, formData) {
        return Promise.resolve(undefined);
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
     * @param {Object} module
     * @returns {{string: {translations: {language: string, text: string}}}}
     */
    static loadTranslationsForModule(module) {
        console.log(`Loading translations for ${module.data.name}.`)
        const languages = module.languages
        let out = {}
        if (languages.length > 0) {
            languages.forEach(((language) => {
                console.log(`Current language key: ${language.lang}`)
                if (typeof out["testKey"] === "undefined") {
                    out["testKey"] = {
                        translations: {}
                    }
                }
                out["testKey"].translations[language.lang] = language.name
            }))
        }

        return out
    }

    static async loadTranslations() {
        game.modules.forEach(((module) => {
            if (module.active) {
                let translationsForModule = EditingDialogue.loadTranslationsForModule(module)
                if (Object.keys(translationsForModule).length > 0) {
                    this.TRANSLATIONS[module.id] = {
                        name        : module.data.title,
                        translations: translationsForModule
                    }
                }
            }
        }))
    }

    static async displayTranslationsForModule(moduleId) {
        const data = this.TRANSLATIONS[moduleId]
        alert(`<pre>${JSON.stringify(data)}</pre>`)
    }

    toggleSelect() {
        const editor = $('#translation-editor-editor')
        const select = editor.find('select.moduleList')
        const loadingIcon = editor.find('i.loadingIcon')
        if (select.hasClass("disabled")) {
            select.removeClass('disabled').attr('disabled', false)
            loadingIcon.addClass('hidden')
        } else {
            select.addClass('disabled').attr('disabled', true)
            loadingIcon.removeClass('hidden')
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('#translation-editor-editor').find('select.moduleList').on('change', async function () {
            await EditingDialogue.displayTranslationsForModule($(this).val())
        })
    }

}
