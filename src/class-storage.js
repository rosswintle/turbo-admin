/**
 * This class is an abstraction of the browser extension storage API
 * (see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)
 * but that falls back to using regular localStorage if we're not in a
 * browser extension.
 *
 * This exists so that the same API can be used from both the browser
 * extension AND the plugin version of Turbo Admin.
 *
 * Note that for the extension, data saved is "global" to the extension
 * and is NOT site specific.
 */
export default class Storage {

    /**
     * Constructor - detects where code is running and sets the local
     * store appropriately.
     */
    constructor() {
        /** @type {null|storageStorageArea|WindowLocalStorage} */
        this.store = null;

        if ('undefined' === typeof (browser)) {
            this.store = window.localStorage;
        } else {
            this.store = browser.storage.local;
        }
    }

    /**
     * Set/save extension data. Must be passed an object with key/value
     * pairs.
     *
     * @param {Object} dataObject
     */
    async set(dataObject) {
        if ('undefined' === typeof (browser)) {
            const keys = Object.keys(dataObject);
            keys.forEach(key => this.store.setItem(key, JSON.stringify(dataObject[key])));
        } else {
            await this.store.set(dataObject);
        }
    }

    /**
     * Get data from the extension's storage.
     *
     * Note that fetched data will be a object with the key as a
     * property.
     *
     * @param {String} key
     * @returns {Promise<Object>}
     */
    async get(key) {
        if ('undefined' === typeof (browser)) {
            let returnObj = {};
            let item = this.store.getItem(key);
            if (! item) {
                return returnObj;
            }
            let itemObject = null;
            try {
                itemObject = JSON.parse(this.store.getItem(key));
            } catch (e) {
                itemObject = null;
            }
            returnObj[key] = itemObject;
            return returnObj;
        } else {
            return await this.store.get(key);
        }
    }

}
