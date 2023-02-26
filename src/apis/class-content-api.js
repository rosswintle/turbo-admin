import Storage from '../class-storage.js';

export default class ContentApi {

    constructor() {
        // this.discoverApiRoot().then(e => null);
        // turboAdminLog('Discovered API base: ', this.apiBase);
        this.active = false;
        this.store = new Storage();
        this.postTypes = [];

        // This is used to "cache" duplicate requests.
        // It's an object because it will have search strings as keys
        this.cache = {};
    }

    async discoverApiRoot() {
        turboAdminLog('Discovering API root');
        let wpApiSettings = null;
        this.storageKey = 'wpApiSettings.' + globalThis.taWp.home;

        // Could be in the wp-api-request-js-extra (on wp-admin side)
        const wpApiSettingsScript = document.getElementById('wp-api-request-js-extra');
        if (wpApiSettingsScript) {
            const wpApiSettingsString = wpApiSettingsScript.innerHTML.match(/var\s+wpApiSettings\s+=\s+(.+);/)[1];
            const wpApiSettings = JSON.parse(wpApiSettingsString);
            const objectToSave = {};
            objectToSave[this.storageKey] = wpApiSettings;
            await this.store.set(objectToSave);
            this.apiRoot = wpApiSettings.root;
            this.apiBase = this.apiRoot + wpApiSettings.versionString;
            this.apiNonce = wpApiSettings.nonce;
            // Clear the nonce if one is set and we're not logged in
            this.maybeExpireNonce(wpApiSettings);
            this.active = true;
            return;
        }

        // Getting from extension storage returns a object with the key
        // as the key. Which is weird.
        wpApiSettings = await this.store.get(this.storageKey);
        if (wpApiSettings
            && Object.keys(wpApiSettings).length !== 0
            && wpApiSettings[this.storageKey]
            && 'object' === typeof(wpApiSettings[this.storageKey])) {
            // Get the key'ed item out of the object
            wpApiSettings = wpApiSettings[this.storageKey];
            this.apiRoot = wpApiSettings.root;
            this.apiBase = this.apiRoot + wpApiSettings.versionString;
            this.apiNonce = wpApiSettings.nonce;
            // Clear the nonce if one is set and we're not logged in
            this.maybeExpireNonce(wpApiSettings);
            this.active = true;
            return;
        }

        // Could be in <link rel="https://api.w.org/" href="https://something/wp-json/">
        if (globalThis.taWp.apiLinkUrl) {
            this.apiRoot = globalThis.taWp.apiLinkUrl;
            // Just guess this
            this.apiBase = this.apiRoot + 'wp/v2/';
            this.active = true;
            return;
        }
        // This should be very rare. I should only really see it in development.
        turboAdminLog('API Route Discovery failed');
        // Making best guess
        this.apiBase = globalThis.taWp.home + '/wp-json/wp/v2/';
        // TODO: This can't display as the palette isn't created yet.
        // globalThis.turboAdmin.turboAdminPalette.showPaletteNotice('Can\'t find the WP API. Try visiting the dashboard to refresh things.');
    }

    async discoverPostTypes() {
        turboAdminLog('Discovering post types');
        if (! this.active) {
            turboAdminLog('Not active');
            this.postTypes = [];
            return;
        }

        const postTypes = await this.store.get('ta-post-types');

        // Check local storage cache
        if (postTypes && postTypes['ta-post-types'] && postTypes['ta-post-types']['expiry'] > Date.now()) {
            turboAdminLog('Using cached post types: ', postTypes['ta-post-types']['data']);
            this.postTypes = postTypes['ta-post-types']['data'];
            return;
        }

        this.postTypes = await this.getPostTypes();
        turboAdminLog('Discovered post types: ', this.postTypes);

        // Cache for 10 minutes
        const expiry = Date.now() + (10 * 60 * 1000);
        this.store.set({
            'ta-post-types': {
                expiry: expiry,
                data: this.postTypes
            }
        });
    }

    userLoggedIn() {
        return document.body.classList.contains('logged-in') ||
            document.body.classList.contains('wp-admin');
    }

    async maybeExpireNonce(wpApiSettings) {
        if (wpApiSettings?.nonce && ! this.userLoggedIn()) {
            // Clear apiSetting nonce
            this.apiNonce = null;
            wpApiSettings.nonce = null;
            const objectToSave = {};
            objectToSave[this.storageKey] = wpApiSettings;
            await this.store.set(objectToSave);
        }
    }

    makeParamString(data) {
        const params = new URLSearchParams();

        Object.keys(data).forEach(paramKey => {
            // Handle arrays
            if (Array.isArray(data[paramKey])) {
                const arrayParamKey = paramKey + '[]';
                data[paramKey].forEach( item => params.append(arrayParamKey, item));
            } else {
                params.append(paramKey, data[paramKey]);
            }
        });

        return params.toString();
    }

    statuses() {
        if (this.apiNonce) {
            return ["publish", "future", "draft", "pending", "private"];
        } else {
            return ["publish"];
        }
    }

    async getPostTypes() {
        // Check the cache
        if (undefined !== this.cache['postsTypes']) {
            return this.cache['postTypes'];
        }

        // Fetch results
        const response = await this.get('types');

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache['postTypes'] = result;

        return result;
    }

    async getPosts(searchString, postType = 'any') {
        // Check the cache
        const cacheKey =  `posts-${postType}-${searchString}`;
        if (undefined !== this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        // Fetch results
        const response = await this.get(
            // "posts",
            "search",
            {
                search: searchString,
                per_page: 100,
                // status: this.statuses(),
                type: 'post',
                subtype: postType
            }
        );

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache[cacheKey] = result;

        return result;
    }

    /**
     * We can't use the API to get a post of any post type. So we hack this a bit.
     *
     * @param {number} postId
     * @returns {Promise<any>}
     */
    async doesPostExist(postId) {
        // Check the cache
        if (undefined !== this.cache['post-' + postId]) {
            return this.cache['post-' + postId];
        }

        const init = {
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'no-store',
            credentials: 'include'
        }

        const response = await fetch(`${globalThis.taWp.siteUrl}/post.php?post=${postId}&action=edit`, init);

        this.cache['post-' + postId] = response;

        return response?.status === 200;
    }

    async getPlugins(searchString) {
        // Check the cache
        if (undefined !== this.cache['plugins-' + searchString]) {
            return this.cache['plugins-' + searchString];
        }

        let requestOptions = {};

        if (searchString) {
            requestOptions.search = searchString;
        }

        // Fetch results
        const response = await this.get(
            "plugins",
            requestOptions
        );

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache['plugins-' + searchString] = result;

        return result;
    }

    async getUsers(searchString) {
        // Check the cache
        if (undefined !== this.cache['users-' + searchString]) {
            return this.cache['users-' + searchString];
        }

        // Fetch results
        const response = await this.get(
            "users",
            {
                search: searchString,
                per_page: 100,
                context: 'edit' // view / embed / edit
            }
        );

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache['users-' + searchString] = result;

        return result;
    }

    async get(path, data = {}) {
        const init = {
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'no-store',
            credentials: 'include'
        }

        // Add the nonce if there is one
        if (this.apiNonce) {
            data._wpnonce = this.apiNonce;
        }

        const params = this.makeParamString(data);

        const response = await fetch(`${this.apiBase}${path}/?${params}`, init);

        if (response.status < 200 || response.status >= 300) {
            // TODO: Set a "deferred" notice to show when the palette is created?
            if (globalThis.turboAdmin && globalThis.turboAdmin.turboAdminPalette) {
                globalThis.turboAdmin.turboAdminPalette.showPaletteNotice('WordPress API Error. Try visiting the dashboard to refresh things.');
            } else {
                // Always log this as people may look
                turboAdminLog( 'TURBO ADMIN: WordPress API Error. Try visiting the WordPress Dashboard to refresh things.' );
            }
        }

        return response;
    }

}
