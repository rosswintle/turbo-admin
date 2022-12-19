import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';

export default class TurboAdminPluginSearch extends TurboAdminPlugin {
    constructor() {
        super('WP Plugins');

        this.searchModes.push( new SearchMode('plugin', 'Plugins', this.pluginSearch, this.defaultPluginItems.bind(this)) );
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        // TODO: Is this right? Should we check for API access?
        return true;
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();
    }

    /**
     * Callback to get default items when entering a search mode
     *
     * @returns {Promise<ContentItem[]>}
     */
    async defaultPluginItems() {
        return await this.pluginSearch('');
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async pluginSearch(searchString) {
        /**
         * Possible actual code
         */
        const results = await globalThis.contentApi.getPlugins(searchString);

        if (! Array.isArray(results)) {
            return [];
        }

        return results.map(result => {
                            // siteUrl is at globalThis.turboAdmin.wp.siteUrl
                            const item = new ContentItem;
                            item.title = result.name;
                            item.subtype = 'Plugin';
                            // TODO: Maybe set this to be a search on the plugin screen?
                            // Plugin "slug" is in result.name

                            const itemViewUrlParams = new URLSearchParams();
                            itemViewUrlParams.set('plugin_status', 'all');
                            itemViewUrlParams.set('s', result.name);
                            item.submenuItems.push(
                                new SubmenuItem(
                                    'View',
                                    globalThis.taWp.siteUrl + '/plugins.php?' + itemViewUrlParams.toString()
                                )
                            );
                            // Activate: /wp-admin/plugins.php?action=activate&plugin=order-simulator-woocommerce%2Fwoocommerce-order-simulator.php&plugin_status=all&paged=1&s&_wpnonce=3714a01759

                            return item;
                        });
    }
}
