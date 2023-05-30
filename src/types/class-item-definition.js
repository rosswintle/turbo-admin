/**
 * An item definition specifies how to detect a palette item from the Dashboard's Dom
 *
 * These are all processed on initialisation to generate menu items.
 *
 * Note that a single definition may generate multiple menu items if the selectors used
 * discover multiple items.
 */
export default class ItemDefinition {
    /**
     * This callback is displayed as part of the Requester class.
    * @callback menuItemCallback
    * @param {HTMLElement} element
    * @returns {string}
    */

    /**
     * This callback is displayed as part of the Requester class.
    * @callback menuActionInfoCallback
    * @param {HTMLElement} element
    * @returns {Object}
    */

    /**
     * The method of detecting items. Can be:
     *  - 'dom' for checking if a DOM element exists (requires detectSelector or detectSelectorNone)
     *  - 'url' if the current URL is being checked (requires detectPattern)
     *  - 'none' if no detection is required - this item will always be added
     *
     * @type {string}
     */
    detectType = 'dom';

    /**
     * [OPTIONAL] A CSS selector used to find items in the DOM
     *
     * @type {string}
     */
    detectSelector = '';

    /**
     * [OPTIONAL] A CSS selector used to check for an absence of items in the DOM
     *
     * @type {string}
     */
    detectSelectorNone = '';

    /**
     * [OPTIONAL] A string to find in the current URL to detect the item
     *
     * @type {string}
     */
    detectPattern = '';

    /**
     * A callback used to generate a menu item title from a detected element. Should be passed an
     * HTML element and should return a string
     *
     * @type {menuItemCallback|null}
     */
     itemTitleFunction = null;

    /**
     * The type of action to take when the item is clicked. Can be:
     * - 'url' to visit a URL (default)
     * - 'search-mode' to enter a search mode
     *
     * @type {string}
     */
    itemActionType = 'url';

    /**
     * A callback used to generate a menu item link URL from a detected element. Should be passed an
     * HTML element and should return a string
     *
     * @type {menuItemCallback|null}
     */
     itemUrlFunction = null;

    /**
     * A callback used to generate an object containing data used by the specified action type.
     *
     * For 'search-mode' the object should be like { searchMode: '<keyword>' }
     *
     * @type {menuActionInfoCallback|null}
     */
    itemActionInfoFunction = null;

     /**
      * True if the item is not to be cached. Used for things like post-specific links like "Edit post"
      *
      * @type {boolean}
      */
     noCache = false;
}
