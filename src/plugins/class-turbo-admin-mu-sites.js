import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';

export default class TurboAdminMUSites extends TurboAdminPlugin {
    constructor() {
        super('WP Multisite Sites');

        this.searchModes.push( new SearchMode('site', 'Sites', this.siteSearch.bind(this), this.defaultSiteItems.bind(this)) );
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        return Boolean(document.querySelector('#wp-admin-bar-my-sites'));
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
     async defaultSiteItems() {
        return await this.siteSearch('');
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async siteSearch(searchString) {
        // {
        //     'detectType': 'dom',
        //     'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-my-sites-list .ab-submenu a',
        //     'itemTitleFunction': (element) => "Sites: " + element.closest('.menupop').querySelector('a').innerText + ' - ' + element.innerText,
        //     'itemUrlFunction': (element) => element.href
        // },

        const sites = document.querySelectorAll('#wp-admin-bar-my-sites #wp-admin-bar-my-sites-list > li');

        if (sites.length === 0) {
            return [];
        }

        const sitesArray = Array.from(sites);
        const sitesLinks = sitesArray.map(site => site.querySelector('a'));
        const filteredSites = sitesLinks.filter(site => site.innerText.toLowerCase().includes(searchString.toLowerCase()));

        return filteredSites.map(site => {
            const item = new ContentItem;
            item.title = site.innerText;
            item.subtype = 'Site';
            item.url = site.href;

            item.submenuItems = item.submenuItems.concat(this.makeSubmenuItems(site));

            return item;
        });
    }

    makeSubmenuItems(siteElement) {
        const submenuItems = [];

        const submenu = siteElement.nextElementSibling.querySelector(`.ab-submenu`);
        if (! submenu) {
            return [];
        }

        const submenuLinks = submenu.querySelectorAll('a');
        if (submenuLinks.length === 0) {
            return [];
        }

        const submenuLinksArray = Array.from(submenuLinks);
        submenuLinksArray.forEach(link => {
            const submenuItem = new SubmenuItem(link.innerText, link.href);
            submenuItems.push(submenuItem);
        });

        return submenuItems;
    }
}
