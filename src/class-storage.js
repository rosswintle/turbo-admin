export default class Storage {

    constructor() {
        if ('undefined' === typeof (browser)) {
            this.store = window.localStorage;
        } else {
            this.store = browser.storage.local;
        }
    }

    async set(dataObject) {
        if ('undefined' === typeof (browser)) {
            const keys = Object.keys(dataObject);
            keys.forEach(key => this.store.setItem(key, JSON.stringify(dataObject[key])));
        } else {
            await this.store.set(dataObject);
        }
    }

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
