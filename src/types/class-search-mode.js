import ContentItem from "./class-content-item";

export default class SearchMode {
    /**
     * The keyword string used to initiate the search
     *
     * @type {string}
     */
    keyword = '';

    /**
     * The dispay name used for the search
     *
     * @type {string}
     */
    displayName = '';

    /**
     * jsDoc defintion for a `searchCallback`
     *
     * @callback SearchCallback
     * @param {string} [searchString]
     * @returns {Promise<ContentItem[]>}
     */

    /**
     * Callback to get search items
     *
     * @type {SearchCallback}
     */
    searchCallback;

    /**
     * Callback to get default items when entering a search mode
     *
     * @type {SearchCallback|null}
     */
    defaultItemsCallback = null;

    /**
     * Constructs a new search mode
     *
     * @param {string} keyword
     * @param {string} displayName
     * @param {SearchCallback} searchCallback
     * @param {SearchCallback} defaultItemsCallback
     */
    constructor(keyword, displayName, searchCallback, defaultItemsCallback = null) {
        this.keyword = keyword;
        this.displayName = displayName;
        this.searchCallback = searchCallback;
        this.defaultItemsCallback = defaultItemsCallback;
    }
}
