import SubmenuItem from "./class-submenu-item";

export default class ContentItem {
    /**
     * The title of the item
     *
     * @type {string}
     */
    title = '';

    /**
     * The subtype of the item. e.g. for posts, this will be the post type.
     * Used to display extra information about the item.
     *
     * @type {string}
     */
    subtype = '';

    /**
     * The URL of the item. Leave empty if there is a sub-menu.
     *
     * @type {string}
     */
    url = '';

    /**
     * The sub-menu items, if any.
     *
     * This should be an empty array if the item itself has a URL
     *
     * @type {SubmenuItem[]}
     */
    submenuItems = [];
}
