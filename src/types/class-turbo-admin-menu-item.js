/**
 * Menu items are the items ready to appear in the palette.
 *
 * These are standard items, not content items. Though this should probably be standardised.
 */
export default class TurboAdminMenuItem {

    /**
     * The title of the item
     *
     * @type {string}
     */
    title = '';

    /**
     * The action of the item is the URL to visit when the item is clicked
     *
     * @type {string}
     */
    action = '';

    /**
     * The parent title is the title of the parent item under which the current item
     * was found in the WordPress menu.
     *
     * e.g. in Posts -> Add Post, "Posts" is the parent item.
     *
     * @type {string}
     */
    parentTitle = '';

    /**
     * True if the item is not to be cached. Used for things like post-specific links like "Edit post"
     *
     * @type {boolean}
     */
    noCache = false;

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
