export default class SubmenuItem {
    /**
     * The title of the item
     *
     * @type {string}
     */
    title;

    /**
     * The URL of the item
     * @type {string}
     */
    url;

    /**
     * A list of attributes to go on the A tag (not the LI tag)
     *
     * @type {array}
     */
    attributes = [];

    /**
     * Create a submenu item
     *
     * @param {string} title The title of the item
     * @param {string} url The URL of the item
     */
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }

    /**
     * Add an attribute
     *
     * @param {string} name The attribute name
     * @param {string} value The attribute value
     */
    addAttribute(name, value) {
        this.attributes.push({
            name: name,
            value: value
        });
    }
}
