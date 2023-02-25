import Storage from '../class-storage.js';
// import ContentApi from './class-content-api.js';

export default class WoocommerceApi {

    constructor() {
        // This is used to "cache" duplicate requests.
        // It's an object because it will have search strings as keys
        this.cache = {};
    }

    async getOrders(searchString) {
        // Check the cache
        if (undefined !== this.cache['orders-' + searchString]) {
            return this.cache['orders-' + searchString];
        }

        // Fetch results
        const response = await this.wooGet(
            "orders",
            {
                search: searchString,
                per_page: 100,
            }
        );

        if (response === false) {
            return false;
        }

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache['orders-' + searchString] = result;

        return result;
    }

    async getOrder(orderId) {
        // Check the cache
        if (undefined !== this.cache['order-' + orderId]) {
            return this.cache['order-' + orderId];
        }

        // Fetch results
        const response = await this.wooGet(
            `orders/${orderId}`
        );

        if (response === false) {
            return false;
        }

        // Decode JSON
        const result = await response.json();

        let resultAsArray = [ result ];

        // Store in the cache
        this.cache['order-' + orderId] = resultAsArray;

        return resultAsArray;
    }

    async getCustomers(searchString) {
        // Check the cache
        if (undefined !== this.cache['customers-' + searchString]) {
            return this.cache['customers-' + searchString];
        }

        // Fetch results
        const response = await this.wooGet(
            "customers",
            {
                search: searchString,
                per_page: 100,
                role: 'all',
            }
        );

        if (response === false) {
            return false;
        }
        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache['customers-' + searchString] = result;

        return result;
    }

    // TODO: Add docblock and types
    async wooGet(path, data = {}) {
        const wooApiBase = globalThis.contentApi.apiRoot + 'wc/v3/';

        const init = {
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'no-store',
            credentials: 'include'
        }

        // Add the nonce if there is one
        if (globalThis.contentApi.apiNonce) {
            data._wpnonce = globalThis.contentApi.apiNonce;
        }

        const params = globalThis.contentApi.makeParamString(data);

        const response = await fetch(`${wooApiBase}${path}/?${params}`, init);

        if ( response.status === 404 ) {
            return false;
        }
        if ( (response.status < 200 || response.status >= 300) ) {
            // TODO: Set a "deferred" notice to show when the palette is created?
            if (globalThis.turboAdmin && globalThis.turboAdmin.turboAdminPalette) {
                globalThis.turboAdmin.turboAdminPalette.showPaletteNotice('WooCommerce API Error. Try visiting the dashboard to refresh things.');
            } else {
                // Always log this as people may look
                turboAdminLog('TURBO ADMIN: WooCommerce API Error. Try visiting the WordPress Dashboard to refresh things.');
            }
        }

        return response;
    }

}
