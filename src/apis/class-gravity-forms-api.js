import Storage from '../class-storage.js';
// import ContentApi from './class-content-api.js';

export default class GravityFormsApi {

    constructor() {
        // This is used to "cache" duplicate requests.
        // It's an object because it will have search strings as keys
        this.cache = {};
    }

    async getForms(searchString) {
        // Check the cache
        if (undefined !== this.cache['gf-forms-' + searchString]) {
            return this.cache['gf-forms-' + searchString];
        }

        // Fetch results
        const response = await this.gfGet(
            "forms",
            {}
        );

        // Decode JSON
        const result = await response.json();

        // TODO: Trap for errors

        // Filter by search string - the API doesn't do this for us
        const searchStringLowerCase = searchString.toLowerCase();
        const formIds = Object.keys(result);
        for (let k = 0; k < formIds.length; k++) {
            const thisId = formIds[k];
            if (! result[thisId].title.toLowerCase().includes(searchStringLowerCase)) {
                delete result[thisId];
            }
        }

        // Store in the cache
        this.cache['gf-forms-' + searchString] = result;

        return result;
    }

    async gfGet(path, data = {}) {
        const gfApiBase = globalThis.contentApi.apiRoot + 'gf/v2/';

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

        const response = await fetch(`${gfApiBase}${path}/?${params}`);

        if (response.status < 200 || response.status >= 300) {
            // TODO: Set a "deferred" notice to show when the palette is created?
            if (globalThis.turboAdmin && globalThis.turboAdmin.turboAdminPalette) {
                globalThis.turboAdmin.turboAdminPalette.showPaletteNotice('Gravity Forms API Error. Try visiting the dashboard to refresh things.');
            } else {
                // Always log this as people may look
                turboAdminLog('TURBO ADMIN: Gravity Forms API Error. Try visiting the WordPress Dashboard to refresh things.');
            }
        }

        return response;
    }

}
