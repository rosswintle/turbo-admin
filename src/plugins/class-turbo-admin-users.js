import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';

export default class TurboAdminUserSearch extends TurboAdminPlugin {
    constructor() {
        super('WP Users');

        this.searchModes.push( new SearchMode('user', 'Users', this.userSearch, this.defaultUserItems.bind(this)) );
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
     async defaultUserItems() {
        return await this.userSearch('');
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async userSearch(searchString) {
        /**
         * Possible actual code
         */
        const results = await globalThis.contentApi.getUsers(searchString);

        if (! Array.isArray(results)) {
            return [];
        }

        return results.map(result => {
                            const item = new ContentItem;
                            if (result.first_name && result.last_name) {
                                item.title = `${result.first_name} ${result.last_name} - `;
                            }
                            item.title += result.email;
                            item.subtype = result.roles[0];
                            item.url = globalThis.taWp.siteUrl + `/user-edit.php?user_id=${result.id}`;
                            return item;
                        });
    }
}
