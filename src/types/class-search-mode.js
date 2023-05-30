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
     * Set this to false to hide the search mode from the palette - it still
     * works with a keyword, but won't show in the palette's list of items
     *
     * @type {boolean}
     */
    showInPaletteSearch = true;

    /**
     * Constructs a new search mode
     *
     * @param {string} keyword
     * @param {string} displayName
     * @param {SearchCallback} searchCallback
     * @param {SearchCallback} defaultItemsCallback
     * @param {boolean} showInPaletteSearch
     */
    constructor(keyword, displayName, searchCallback, defaultItemsCallback = null, showInPaletteSearch = true) {
        this.keyword = keyword;
        this.displayName = displayName;
        this.searchCallback = searchCallback;
        this.defaultItemsCallback = defaultItemsCallback;
        this.showInPaletteSearch = showInPaletteSearch;
    }
}
