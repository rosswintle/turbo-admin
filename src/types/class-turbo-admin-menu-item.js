import ItemDefinition from "./class-item-definition";

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
     * The type of action to take when the item is clicked. Can be:
     * - 'url' to visit a URL (default)
     * - 'search-mode' to enter a search mode
     */
    actionType = 'url';

    /**
     * The action of the item is the URL to visit when the item is clicked or the action data
     * if the action type is not 'url'
     *
     * @type {string|Object}
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

    /**
     * Creates a new simple menu item (only works for URLs - for more complex items use fromItemDefinition)
     *
     * @param {string} title
     * @param {string} action
     * @param {string} parentTitle
     * @param {boolean} noCache
     */
	constructor(title, action, parentTitle, noCache = false) {
		this.title = title;
        this.actionType = 'url';
		this.action = action;
		this.parentTitle = parentTitle;
        this.noCache = noCache;
	}

    /**
     * Construct a new menu item from an ItemDefinition
     *
     * @param {ItemDefinition} item
     * @param {HTMLElement} element
     * @param {string} parentTitle
     * @return {TurboAdminMenuItem}
     */
    static fromItemDefinition(item, element = null, parentTitle = '') {
        const action = item.itemActionType === 'url' ?
            item.itemUrlFunction(element) :
            item.itemActionInfoFunction(element);

        const menuItem = new TurboAdminMenuItem(
            item.itemTitleFunction(element),
            action,
            parentTitle,
            item?.noCache
        );
        menuItem.actionType = item.itemActionType;
        return menuItem;
    }

    /**
     * Compares this item to another item
     *
     * @param {TurboAdminMenuItem} item
     * @returns {boolean}
     */
    sameAs(item) {
        return item.title === this.title &&
            item.action === this.action &&
            item.parentTitle === this.parentTitle;
    }
}
