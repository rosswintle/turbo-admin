export default class TurboAdminMenuItem {

	constructor(title, action, parentTitle, noCache = false) {
		this.title = title;
		this.action = action;
		this.parentTitle = parentTitle;
        this.noCache = noCache;
	}

    sameAs(item) {
        return item.title === this.title &&
            item.action === this.action &&
            item.parentTitle === this.parentTitle;
    }
}
