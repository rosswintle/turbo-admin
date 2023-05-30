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
     * Get the item definitions for search modes.
     *
     * Note that , at time of writing, this runs AFTER API init but before the plugin is activated.
     * So APIs are available (and may be used in shouldActivate()) but the plugin is not yet activated.
     *
     * @return {Promise<ItemDefinition[]>}
     */
    async getSearchModeItemDefinitions() {
        if (!this.shouldActivate()) {
            return [];
        }

        const searchModeItems = this.searchModes.map(searchMode => {
            // Return null if we don't want to show this search mode in the palette.
            if (searchMode.showInPaletteSearch === false) {
                return null;
            }
            const item = new ItemDefinition();
            item.detectType = 'none';
            item.itemTitleFunction = () => `<span style="font-style:italic;">Search</span>: ${searchMode.displayName}`;
            item.itemActionType = 'search-mode';
            item.itemActionInfoFunction = () => { return { searchMode: searchMode.keyword } };
            return item;
        })
        // Filter out the nulls.
        return searchModeItems.filter( item => item !== null);
    }

    /**
     * Get additional menu items to be added to the main menu
     *
     * @return {Promise<ItemDefinition[]>}
     */
    async getAdditionalItemDefinitions() {
        if (!this.activated) {
            return [];
        }

        return [];
    }

    /**
     * Save plugin setting to persistent storage
     */
    saveSetting(key, value) {

    }

}
