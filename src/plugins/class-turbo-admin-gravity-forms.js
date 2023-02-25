import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';

export default class TurboAdminGravityForms extends TurboAdminPlugin {
    constructor() {
        super('GravityForms');

        this.searchModes.push( new SearchMode('form', 'Gravity Forms', this.formSearch, this.defaultFormsList.bind(this)) );
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        return globalThis.contentApi.active &&
               document.getElementById('wp-admin-bar-gravityforms-new-form') !== null
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();
    }

    /**
     *
     * @returns {Promise<ContentItem[]>}
     */
    async defaultFormsList() {
        return await this.formSearch('');
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async formSearch(searchString) {
        const resultsObject = await globalThis.gravityFormsApi.getForms(searchString);
        // GF Results are an object rather than an array so we need to convert

        // TODO: Catch the error response (do the TODO in the API class first)

        const resultsArray = [];
        const resultKeys = Object.keys(resultsObject);
        for(let k = 0; k < resultKeys.length; k++) {
            const result = resultsObject[resultKeys[k]];
            const item = new ContentItem;
            item.title = `#${result.id} ${result.title}`;
            item.subtype = `${result.entries} entries`;
            item.url = globalThis.taWp.siteUrl + `/post.php?post=${result.id}&action=edit`;

            item.submenuItems.push(
                new SubmenuItem(
                    'Edit Form',
                    globalThis.taWp.siteUrl + `/admin.php?page=gf_edit_forms&id=${result.id}`
                )
            )
            item.submenuItems.push(
                new SubmenuItem(
                    'Entries',
                    globalThis.taWp.siteUrl + `/admin.php?page=gf_entries&id=${result.id}`
                )
            )
            item.submenuItems.push(
                new SubmenuItem(
                    'Form Settings',
                    globalThis.taWp.siteUrl + `/admin.php?page=gf_edit_forms&view=settings&subview=settings&id=${result.id}`
                )
            )
            item.submenuItems.push(
                new SubmenuItem(
                    'Confirmatons',
                    globalThis.taWp.siteUrl + `/admin.php?page=gf_edit_forms&view=settings&subview=confirmation&id=${result.id}`
                )
            )
            item.submenuItems.push(
                new SubmenuItem(
                    'Notifications',
                    globalThis.taWp.siteUrl + `/admin.php?page=gf_edit_forms&view=settings&subview=notification&id=${result.id}`
                )
            )

            turboAdminLog(item);

            resultsArray.push(item);
        }
        return resultsArray;
    }
}
