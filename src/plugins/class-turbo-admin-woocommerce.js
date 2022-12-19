import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';

export default class TurboAdminWoocommerce extends TurboAdminPlugin {
    constructor() {
        super('WooCommerce');

        this.searchModes.push( new SearchMode('order', 'Orders', this.orderSearch) );
        this.searchModes.push( new SearchMode('customer', 'Customers', this.customerSearch) );
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        // Check for presence of WooCommerce in Dashboard
        /** @type {HTMLElement|string|Number} */
        let woocommerceMenuElement = document.getElementById('toplevel_page_ct_dashboard_page');

        // Also check for a menu bar item
        if (! woocommerceMenuElement) {
            woocommerceMenuElement = document.getElementById('wp-admin-bar-new-shop_order');
        }

        // Check to see if WooCommerce flag is cached
        if (! woocommerceMenuElement) {
            woocommerceMenuElement = Number(window.localStorage.getItem('ta-has-oxygen-builder'));
        }

        const hasWooCommerce = Boolean(woocommerceMenuElement);

        // Save Oxygen builder status
        window.localStorage.setItem('ta-has-woocommerce', hasWooCommerce ? '1' : '0' );

        return globalThis.contentApi.active && hasWooCommerce;
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async orderSearch(searchString) {
        let results;

        if (searchString.trim().match(/^\d+$/)) {
            results = await globalThis.woocommerceApi.getOrder(searchString);
        } else {
            results = await globalThis.woocommerceApi.getOrders(searchString);
        }

        if (! Array.isArray(results)) {
            return [];
        }

        return results.map(result => {
                            const item = new ContentItem;
                            item.title = `#${result.number} ${result.currency_symbol}${result.total}`;
                            item.subtype = result.billing.email;
                            item.url = globalThis.taWp.siteUrl + `/post.php?post=${result.id}&action=edit`;
                            return item;
                        });
    }

    /**
     * @param {string} searchString
     * @returns {Promise<ContentItem[]>}
     */
    async customerSearch(searchString) {
        const results = await globalThis.woocommerceApi.getCustomers(searchString);

        if (! Array.isArray(results)) {
            return [];
        }

        return results.map(result => {
                            const item = new ContentItem;
                            item.title = `${result.billing.first_name} ${result.billing.last_name}`;
                            item.subtype = result.email;
                            item.url = globalThis.taWp.siteUrl + `/user-edit.php?user_id=${result.id}`;

                            item.submenuItems.push(
                                new SubmenuItem(
                                    'Orders',
                                    globalThis.taWp.siteUrl + `/edit.php?post_status=all&post_type=shop_order&_customer_user=${result.id}`
                                )
                            )

                            item.submenuItems.push(
                                new SubmenuItem(
                                    'Profile',
                                    globalThis.taWp.siteUrl + `/user-edit.php?user_id=${result.id}`
                                )
                            )

                            return item;
                        });
    }
}
