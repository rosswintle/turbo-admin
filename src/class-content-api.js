import Storage from './class-storage.js';

export default class ContentApi {

    constructor() {
        // this.discoverApiRoot().then(e => null);
        // console.log('Discovered API base: ', this.apiBase);
        this.active = false;
        this.store = new Storage();

        // This is used to "cache" duplicate requests.
        // It's an object because it will have search strings as keys
        this.cache = {};
    }

    async discoverApiRoot() {
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

    types() {
        return globalThis.turboAdmin.turboAdminPalette.postTypes;
    }

    async getPosts(searchString) {
        // Check the cache
        if (undefined !== this.cache[searchString]) {
            return this.cache[searchString];
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
                subtype: 'any'
            }
        );

        // Decode JSON
        const result = await response.json();

        // Store in the cache
        this.cache[searchString] = result;

        return result;
    }

    async get(path, data = {}) {
        const init = {
            method: 'GET',
            headers: {},
            mode: 'cors',
            cache: 'no-store',
        }

        // Add the nonce if there is one
        if (this.apiNonce) {
            data._wpnonce = this.apiNonce;
        }

        const params = this.makeParamString(data);

        const response = await fetch(`${this.apiBase}${path}/?${params}`);

        return response;
    }

}
