import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';
import ItemDefinition from '../types/class-item-definition.js';

export default class TurboAdminOxygenBuilder extends TurboAdminPlugin {
    constructor() {
        super('OxygenBuilder');
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        // Check for presence of Oxygen Page builder
        /** @type {HTMLElement|string|Number} */
        let oxygenLinkElem = document.getElementById('toplevel_page_ct_dashboard_page');
        // Also check for a menu bar item
        if (! oxygenLinkElem) {
            oxygenLinkElem = document.getElementById('wp-admin-bar-oxygen_admin_bar_menu');
        }
        // Check to see if Oxygen link is cached
        if (! oxygenLinkElem) {
            oxygenLinkElem = Number(window.localStorage.getItem('ta-has-oxygen-builder'));
        }

        const hasOxygenBuilder = Boolean(oxygenLinkElem);

        // Save Oxygen builder status
        window.localStorage.setItem('ta-has-oxygen-builder', hasOxygenBuilder ? '1' : '0' );

        return hasOxygenBuilder;
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();
    }

    /**
     * Get additional menu items to be added to the main menu
     *
     * @return {Promise<ItemDefinition[]>}
     */
     async getAdditionalItemDefinitions() {
        const editDefinition = new ItemDefinition();
        editDefinition.detectType = 'dom';
        editDefinition.detectSelector = '#ct-edit-template-builder';
        editDefinition.itemTitleFunction = () => 'Edit with Oxygen';
        editDefinition.itemUrlFunction = (element) => element.href;
        editDefinition.noCache = true;

        // It's worth noting that the Oxygen Builder doesn't use a /wp-admin URL
        // and so kinda appears to Turbo Admin to be a "front-end" page and it
        // doesn't refresh the menu items.
        const backToWpDefinition = new ItemDefinition();
        backToWpDefinition.detectType = 'dom';
        backToWpDefinition.detectSelector = '.oxygen-back-to-wp-menu .oxygen-toolbar-button-dropdown a:not(:last-of-type)';
        backToWpDefinition.itemTitleFunction = (element) => 'Back to WP: ' + element.textContent;
        backToWpDefinition.itemUrlFunction = (element) => {
            if (element.href) {
                return element.href;
            } else {
                let url = new URL(window.location.href);
                return url.origin + url.pathname;
            }
        };
        backToWpDefinition.noCache = true;

        return [
            editDefinition,
            backToWpDefinition,
        ];
    }

}
