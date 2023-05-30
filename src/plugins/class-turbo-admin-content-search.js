import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';
import SearchMode from '../types/class-search-mode.js';
import ContentItem from '../types/class-content-item.js';
import SubmenuItem from '../types/class-submenu-item.js';

export default class TurboAdminContentSearch extends TurboAdminPlugin {
    constructor() {
        super('WP Content');

        const ignoredPostTypes = [
            'nav_menu_item',
            'wp_block',
            'wp_template',
            'wp_template_part',
            'wp_navigation',
        ];

        const postTypeKeys = Object.keys(globalThis.contentApi.postTypes);

        // Discard ignored post types
        const filteredPostTypeKeys = postTypeKeys.filter(key => ! ignoredPostTypes.includes(key));

        // Register a search mode for each post type
        for (let i = 0; i < filteredPostTypeKeys.length; i++) {
            const thisPostTypeKey = filteredPostTypeKeys[i];
            const thisPostType = globalThis.contentApi.postTypes[thisPostTypeKey];
            // turboAdminLog('Adding search mode for post type', thisPostType);
            this.searchModes.push( this.makePostTypeSearchMode(thisPostType) );
        }

        // Register ID search mode
        this.searchModes.push( new SearchMode('id', 'Post ID', this.postById.bind(this)) );

        // Register search all post types mode
        this.searchModes.push( new SearchMode('search', 'All post types', this.contentSearch.bind(this)) );
        // Don't show this one in the palette
        this.searchModes.push( new SearchMode('find', 'All post types', this.contentSearch.bind(this), null, false) );
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        // TODO: Is this right? Should we check for API access?
        return true;
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();
    }

    /**
     * This is a generator for a post-type specific SearchMode object
     *
     * @param {Object} postType
     */
    makePostTypeSearchMode(postType) {
        // TODO: interpret the post type name
        return new SearchMode(postType.slug, postType.name, (searchString) => this.contentSearch(searchString, postType.slug));
    }

    /**
     * @param {string} searchString
     * @param {string} postType This is passed to the API as a subtype. 'any' by default.
     * @returns {Promise<ContentItem[]>}
     */
    async contentSearch(searchString, postType = 'any') {
        /**
         * Possible actual code
         */
        const results = await globalThis.contentApi.getPosts(searchString, postType);

        if (! Array.isArray(results)) {
            return [];
        }

        return results.map(result => {
                            const item = new ContentItem;
                            item.title = result.title;
                            item.subtype = result.subtype;
                            item.url = result.url;

                            item.submenuItems = item.submenuItems.concat(this.makeSubmenuItems(result.id, item))

                            return item;
                        });
    }

    /**
     * @param {string} postId
     * @returns {Promise<ContentItem[]>}
     */
    async postById(postId) {
        if (! postId.trim().match(/^\d+$/)) {
            return [];
        }
        const postExists = await globalThis.contentApi.doesPostExist(postId);

        const resultAsContentItem = new ContentItem;

        if (! postExists) {
            resultAsContentItem.title = 'Post does not exist or is not visible';
            return [ resultAsContentItem ];
        }

        resultAsContentItem.title = `Post ID: ${postId}`;
        resultAsContentItem.url = globalThis.taWp.home + `/?p=${postId}`;

        resultAsContentItem.submenuItems = resultAsContentItem.submenuItems.concat(this.makeSubmenuItems(postId, resultAsContentItem));

        return [ resultAsContentItem ];
    }

    /**
     * Makes an array of submenu items from a content item
     *
     * @param {number} postId
     * @param {ContentItem} contentItem
     * @returns {SubmenuItem[]}
      */
    makeSubmenuItems(postId, contentItem) {
        const itemsToReturn = [];
        itemsToReturn.push(
            new SubmenuItem(
                'View',
                contentItem.url
            )
        );

        // TODO: Make a better way to detect if we are logged in.
        if (globalThis.turboAdmin.turboAdminPalette.profileLink) {
            // Need to get edit URL. This seems like the best way for now.
            const editLink = globalThis.taWp.siteUrl + `/post.php?post=${postId}&action=edit`;
            itemsToReturn.push(
                new SubmenuItem(
                    'Edit',
                    editLink
                )
            )

            // Add oxygen link if needed.
            if (globalThis.turboAdmin.hasActivatedPlugin('OxygenBuilder')) {
                const oxygenLink = globalThis.taWp.home + `?page_id=${postId}&ct_builder=true&ct_inner=true`;
                itemsToReturn.push(
                    new SubmenuItem(
                        'Edit with Oxygen',
                        oxygenLink
                    )
                );
            }
        }

        const copyLinkItem = new SubmenuItem( 'Copy link', contentItem.url);
        copyLinkItem.addAttribute('data-action', 'clipboard')
        itemsToReturn.push(copyLinkItem);

        return itemsToReturn;
    }
}
