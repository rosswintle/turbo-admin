import SearchMode from "./class-search-mode";
import ItemDefinition from "./class-item-definition";

/**
 * This is an abstract class that should be extended by plugins
 * @module TurboAdminPlugin
 */
export default class TurboAdminPlugin {
    /** @type {string} */
    name = '';

    /** @type {SearchMode[]} */
    searchModes = [];

    /** @type {boolean} */
    activated = false;

    constructor(pluginName) {
        this.name = pluginName;
        this.registerPlugin();
    }

    /**
     * Register the plugin with Turbo Admin
     */
    registerPlugin() {
        turboAdminLog('Inside plugin - requested registration of ' + this.name);
        globalThis.turboAdmin.registerPlugin(this);
    }

    /**
     * Returns true if the plugin should activate
     * @returns {boolean}
     */
    shouldActivate() {
        return false;
    }

    /**
     * Activates the plugin
     * @return {void}
     */
    activate() {
        this.activated = true;
        this.registerSearchModes();
    }

    /**
     * Register the search keywords with Turbo Admin - each will be registered
     * with the whole plugin object.
     */
    registerSearchModes() {
        this.searchModes.forEach(globalThis.turboAdmin.registerSearchMode);
    }

    /**
     * Get additional menu items to be added to the main menu
     *
     * @return {Promise<ItemDefinition[]>}
     */
    async getAdditionalItemDefinitions() {
        return [];
    }

    /**
     * Save plugin setting to persistent storage
     */
    saveSetting(key, value) {

    }

}
