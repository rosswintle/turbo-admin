export default class Storage {

	constructor() {
		if ('undefined' === typeof(browser)) {
			this.store = window.localStorage;
		} else {
			this.store = browser.storage.local;
		}
	}

	async set(dataObject) {
		if ('undefined' === typeof (browser)) {
			const keys = Object.keys(dataObject);
			keys.forEach(key => this.store.setItem(key, dataObject[key]));
		} else {
			await this.store.set(objectToSave);
		}
	}

	async get(key) {
		if ('undefined' === typeof (browser)) {
			let returnObj = {};
			returnObj[key] = this.store.getItem(key);
			return returnObj;
		} else {
			return await this.store.get(key);
		}
	}

}
