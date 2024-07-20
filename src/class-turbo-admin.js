/*
 * This is the common Turbo Admin library.
 *
 * It's (currently) WordPress-specific, but can be loaded by
 * either the Extension OR the Plugin
 *
 * It takes an options object:
 *
 * options: {
 *   shortcutKeys: [
 *     // Array of shortcut key definitions, like:
 *     {
 *       {
 *         meta: false,
 *         alt: true,
 *         ctrl: true,
 *         shift: true,
 *         key: 'p'
 *       }
 *     }
 *   ],
 *   appendToElement {
 *     // Optional CSS selector to define what to append the palette to
 *     'body'
 *   },
 *   extraItems: [
 *     // Optional array of extra item configs used to generate new item objects
 *     {
 *       'detectType': 'url',
 *       'detectPattern': 'wp-login',
 *       'itemTitle': 'View/visit site',
 *       'itemUrlFunction': () => this.home
 *     },
 *   ],
 *   extraItemsRaw: [
 *     // Optional array of raw item objects to be added
 *     {
 *       'title': ,
 *       'action': ,
 *       'parentTitle': ,
 *     }
 *   ]
 * }
 */

import TurboAdminPalette from './class-turbo-admin-palette.js';
import TurboAdminMenuItem from './types/class-turbo-admin-menu-item.js';
import SearchMode from './types/class-search-mode.js';
import TurboAdminPlugin from './types/class-turbo-admin-plugin.js';
import Acf from './plugins/class-acf.js';
import TurboAdminWpBlockEditorFullscreenKill from './class-turbo-admin-wp-block-editor-fullscreen-kill.js';
import TurboAdminWpBlockEditorWelcomeGuideKill from './class-turbo-admin-wp-block-editor-welcome-guide-kill.js';
import TurboAdminWpNotices from './class-turbo-admin-wp-notices.js';
import TurboAdminListTableShortcuts from './class-list-table-shortcuts.js';
import TurboAdminBarkeeper from './plugins/class-turbo-admin-barkeeper.js';
import TurboAdminContentSearch from './plugins/class-turbo-admin-content-search.js';
import TurboAdminPluginSearch from './plugins/class-turbo-admin-plugins.js';
import TurboAdminUserSearch from './plugins/class-turbo-admin-users.js';
import TurboAdminWoocommerce from './plugins/class-turbo-admin-woocommerce.js';
import TurboAdminGravityForms from './plugins/class-turbo-admin-gravity-forms.js';
import TurboAdminMUSites from './plugins/class-turbo-admin-mu-sites.js';
import TurboAdminOxygenBuilder from './plugins/class-turbo-admin-oxygen-buillder.js';

export default class TurboAdmin {

    /**
     * @param {*} options
     * @returns {TurboAdmin}
     */
    constructor(options) {
        // Sometimes we get a second copy of TA running, like if the plugin is running too.
        // Is this case we want to skip the initialisation.
        this.doInit = true;

        if (document.getElementById('ta-command-palette-container')) {
            console.log('TurboAdmin already initialised - I won\'t make a second copy!');
            this.doInit = false;
            return globalThis.turboAdmin;
        }

        this.options = options;
        this.plugins = {};

        // TODO: Something? What should this type be?
        this.searchModes = {};

        // On the front end we set this if there is no saved menu.
        this.menuNeedsRefresh = false;
    }

    /**
     * Perform initialization - this is all the things that do not need APIs to
     * get set up.
     */
    async init() {
        if (! this.doInit) {
            return;
        }

        // Register all the plugins
        new TurboAdminBarkeeper();
        new TurboAdminContentSearch();
        new TurboAdminPluginSearch();
        new TurboAdminUserSearch();
        new TurboAdminMUSites();
        new TurboAdminOxygenBuilder();

        if (window.turboAdminIsExtension()) {
            new TurboAdminWoocommerce();
            new TurboAdminGravityForms();
        }

        // Grab the global Wp object instance
        this.wp = globalThis.taWp;

        this.menu = [];

        // Check for saved menu when on front-end
        if (! this.wp.isBackend) {
            // Only use the cached items if the current URL matches the last site URL
            // This handles changes of multi-site site!
            // We ONLY need to do this on the front-end as the back-end will always
            // refresh the menu.
            if (! this.wp.siteChanged) {
                // Check for .logged-in class on body - if logged in, we can use the saved menu,
                // if it exists.
                if (document.body.classList.contains('logged-in')) {
                    // Get from localStorage
                    const savedMenu = window.localStorage.getItem('ta-palette-data');

                    // This attempts to see if we have cached items from the back-en
                    if (null === savedMenu) {
                        this.menuNeedsRefresh = true;
                    } else {
                        this.menu = JSON.parse(savedMenu);
                        // Check if there is no "Media" item  - this should ONLY be in the back-end
                        if (! this.menu.some(item => ( ( typeof(item.action) === 'string' ) && ( item.action.endsWith('upload.php') ) ))) {
                            this.menuNeedsRefresh = true;
                        }
                        // Merge (?) the items?
                    }
                }
            }
        } else {
            // On the back end, get the WordPress dashboard menu items
            this.menu = this.getMenu();
        }

        // Add other additional items
        await this.addAdditionalMenuItems();
        // Add items passed in using extraItemsRaw
        this.menu = this.menu.concat(this.options.extraItemsRaw ?? []);

        // Add ACF items?
        // TODO: Make this better. Possible ASYNC somehow?
        // this.acf = new Acf();
        // if (this.acf.isAcfInstalled()) {
        //     const acfLinks = await this.acf.getFieldGroups()
        //     // console.table(acfItems);
        //     const acfMenuItems = acfLinks.map(
        //         item => new TurboAdminMenuItem(
        //             item.label + ' (ACF)',
        //             item.link,
        //             ''
        //         )
        //     );
        //     this.menu = this.menu.concat(acfMenuItems);
        // }

        // Sort the menu
        this.menu.sort((a, b) => (a.parentTitle + a.title).localeCompare(b.parentTitle + b.title));

        // Filter out no-cache items and save to localStorage.
        const itemsToSave = this.menu.filter(item => (! item.noCache));
        window.localStorage.setItem('ta-palette-data', JSON.stringify(itemsToSave));

        // Add palette markup to the DOM
        this.addPalette();
        // Initialise controls on the palette
        this.turboAdminPalette = new TurboAdminPalette(this.menu, this.options);
    }

    /**
     * These are initialization steps that DO needs APIs to be set up.
     */
    activatePlugins() {
        // Initialize all plugins
        Object.keys(this.plugins).forEach( plugin => {
            if (this.plugins[plugin].shouldActivate()) {
                this.plugins[plugin].activate();
            }
        })

        if (true === this.options['block-editor-fullscreen-disable']) {
            // Initialise fullscreen kill
            this.turboAdminFullscreenKill = new TurboAdminWpBlockEditorFullscreenKill();
        }

        if (true === this.options['block-editor-welcome-screen-kill']) {
            this.turboAdminWelcomeKill = new TurboAdminWpBlockEditorWelcomeGuideKill();
        }

        if (true === this.options['list-table-keyboard-shortcuts']) {
            this.turboAdminListTableShortcuts = new TurboAdminListTableShortcuts();
        }

        // Add other things if we're logged in and have an API nonce
        if (globalThis.contentApi.userLoggedIn()) {
            // What shall we do?
        }
    }

    /**
     * True if the plugin has been activated
     *
     * @param {string} name Name of the plugin to check for
     * @returns {boolean}
     */
    hasActivatedPlugin(name) {
        return Object.keys(this.plugins).includes(name) &&
            this.plugins[name].activated;
    }

    /**
     * Gather the WordPress dashboard admin (sidebar) menu items
     *
     * @returns { TurboAdminMenuItem[] }
     */
    getMenu() {
        const items = [];
        const menuTop = document.getElementById('adminmenu');
        if (menuTop) {
            const topDOMItems = menuTop.querySelectorAll('li.menu-top');
            topDOMItems.forEach(el => {
                const a = el.querySelector('a.menu-top');
                const title = a.querySelector('.wp-menu-name').innerHTML;
                const action = a.href;
                const parentTitle = '';
                const item = new TurboAdminMenuItem(title, action, parentTitle);
                items.push(item);

                const subMenu = el.querySelector('.wp-submenu');
                if (!subMenu) {
                    return;
                }
                const subItems = subMenu.querySelectorAll('li a');
                if (!subItems) {
                    return;
                }
                subItems.forEach(subEl => {
                    const parentTitle = title;
                    const childTitle = subEl.innerHTML;
                    const childAction = subEl.href;
                    const item = new TurboAdminMenuItem(childTitle, childAction, parentTitle);
                    items.push(item);
                })
            });
        }
        return items;
    }

    /**
     * Adds additional menu items passed in by configuration to the
     * menu items list.
     */
    async addAdditionalMenuItems() {

        /*
         * I'd LOVE for this to be config driven
         *
         * [
         *   {
         *     'detectType': 'url',
         *     'detectPattern': 'wp-login',
         *     'itemTitle': 'View/visit site',
         *     'itemUrlFunction': () => this.home
         *   },
         *   {
         *     'detectType': 'dom',
         *     'detectSelector': '#wpadminbar',
         *     'itemTitle': 'Logout',
         *     'itemUrlFunction': () => logoutUrl
         *   }
         *  Can we add actionTypes as well? To do clicks and navigates?
         * ]
         */

        // Get passed-in extraItems
        // Technically this is an array of {ItemDefintion} but more work needed to make that happen.
        let extraItems = this.options.extraItems ?? [];

        // Get any extra items defined by plugins
        const pluginKeys = Object.keys(this.plugins);

        for (let i=0; i < pluginKeys.length; i++) {
            extraItems = extraItems.concat(await this.plugins[pluginKeys[i]].getSearchModeItemDefinitions());
            extraItems = extraItems.concat(await this.plugins[pluginKeys[i]].getAdditionalItemDefinitions());
        }

        // Merge in defaults
        extraItems = extraItems.concat(
            [
                // TODO: Convert to ItemDefinition objects
                {
                    'detectType': 'dom',
                    'detectSelector': 'body.wp-admin #wp-admin-bar-view-site a',
                    'itemActionType': 'url',
                    'itemTitleFunction': () => 'View/visit site',
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-dashboard a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (element) => element.textContent,
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wpadminbar',
                    'itemActionType': 'url',
                    'itemTitleFunction': () => 'Logout',
                    'itemUrlFunction': () => document.getElementById('wp-admin-bar-logout')?.querySelector('a')?.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-edit a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href,
                    'noCache': true,
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-view a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href,
                    'noCache': true,
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-new-content .ab-submenu a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (item) => 'New ' + item.textContent,
                    'itemUrlFunction': (item) => item.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-customize a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href
                },
                {
                    'detectType': 'dom',
                    'detectSelectorNone': '#wpadminbar, #loginform',
                    'itemActionType': 'url',
                    'itemTitleFunction': () => "Log in",
                    'itemUrlFunction': () => {
                        if (globalThis.taWp.home) {
                            return globalThis.taWp.ensureTrailingSlash(globalThis.taWp.siteUrl);
                        }
                        // Try getting wp-admin
                        return 'javascript:alert(\'Sorry, could not detect login URL.\')';
                    }
                },
                // This is on the login screen
                {
                    'detectType': 'dom',
                    'detectSelector': '#backtoblog a',
                    'itemActionType': 'url',
                    'itemTitleFunction': () => "View/visit site",
                    'itemUrlFunction': (element) => element.href
                },
                // Multisite items
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-network-admin > a',
                    'itemActionType': 'url',
                    'itemTitleFunction': () => "Network Admin",
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-network-admin .ab-submenu a',
                    'itemActionType': 'url',
                    'itemTitleFunction': (element) => 'Network Admin: ' + element.textContent,
                    'itemUrlFunction': (element) => element.href
                },
            ]
        );

        extraItems.forEach(item => {
            let detected = false;
            let elements = null;
            if (item.detectType === 'none') {
                detected = true;
                // Just grab any old element. We shouldn't need it.
                elements = document.querySelectorAll('body');
            } else if (item.detectType === 'url') {
                detected = Boolean(window.location.href.includes(item.detectPattern));
                // Just grab any old element. We shouldn't need it.
                elements = document.querySelectorAll('body');
            } else if (item.detectType === 'dom') {
                if (item.detectSelector) {
                    elements = document.querySelectorAll(item.detectSelector);
                    detected = Boolean(elements);
                } else if (item.detectSelectorNone) {
                    elements = document.querySelectorAll(item.detectSelectorNone);
                    detected = elements.length === 0;
                    // Need to pass SOMETHING to the loop below
                    elements = document.querySelectorAll('body');
                }
            }
            if (!detected) {
                return;
            }

            elements.forEach(element => {
                const newItem = TurboAdminMenuItem.fromItemDefinition(item, element, '');
                // Might already have one so check.
                if (this.menu.some(menuItem => {
                    // This must be newItem.sameAs, not menuItem.sameAs because the menuItem
                    // may have been loaded from saved menu and may not actually be an instance
                    // of a TurboAdminMenuItem.
                    return newItem.sameAs(menuItem)
                } )) {
                    return;
                }
                // We don't already have one. So add it.
                this.menu.push(newItem);
            });
        })
    }

    /**
     * Builds the palette HTML and adds it to the DOM.
     */
    addPalette() {
        const container = document.createElement('div');
        container.id = 'ta-command-palette-container';
        // Palette
        const palette = document.createElement('div');
        palette.id = 'ta-command-palette';
        // Palette notice
        const paletteNotice = document.createElement('div');
        paletteNotice.id = 'ta-command-palette-notice';
        // Tab notice
        const tabNotice = document.createElement('div');
        tabNotice.id = 'ta-command-palette-tab-notice';
        // Tab notice text
        const tabNoticeText = document.createElement('span');
        tabNoticeText.id = 'ta-command-palette-tab-notice-text';
        // Tab notice "button"
        const tabNoticeButton = document.createElement('span');
        tabNoticeButton.id = 'ta-command-palette-tab-notice-button';
        tabNoticeButton.innerText = 'Tab';
        // Input field
        const input = document.createElement('input');
        input.id = "ta-command-palette-input";
        input.name = "ta-command-palette-input";
        input.type = "text";
        // Set this to stop stuff trying to fill it.
        input.setAttribute('autocomplete', 'off');
        // Search mode tag
        const searchModeTag = document.createElement('div');
        searchModeTag.id = 'ta-command-palette-search-mode-tag';
        // List container (needed to contain the main list and the submenu list)
        const listContainer = document.createElement('div');
        listContainer.id = "ta-command-palette-items-container";
        // List
        const list = document.createElement('ul');
        list.id = "ta-command-palette-items";
        // Sub-menu list
        const submenuContainer = document.createElement('div');
        submenuContainer.id = "ta-command-palette-submenu-container";
        // Join it all up
        container.appendChild(palette);
        palette.appendChild(searchModeTag);
        palette.appendChild(paletteNotice);
        tabNotice.appendChild(tabNoticeText);
        tabNotice.appendChild(tabNoticeButton);
        palette.appendChild(tabNotice);
        palette.appendChild(input);
        listContainer.appendChild(list);
        listContainer.appendChild(submenuContainer);
        palette.appendChild(listContainer);

        if (document.getElementById('wpadminbar') && this.options['admin-bar-search'] === true) {
            const paletteLi = document.createElement('li');
            paletteLi.appendChild(container);
            const adminBar = document.getElementById('wp-admin-bar-top-secondary');
            adminBar.appendChild(paletteLi);

            // Add focus handler
            input.addEventListener('focus', e => this.turboAdminPalette.showPalette());

            // Add placeholder
            const placeholder = document.createElement('div');
            placeholder.id = 'ta-shortcut-key-placeholder';
            placeholder.innerText = this.buildShortcutKeysString();
            placeholder.addEventListener('click', e => input.focus());

            palette.insertBefore( placeholder, listContainer );
        } else {
            // Container
            document.querySelector(this.options.appendToElement ?? 'body').appendChild(container);
        }
    }

    /**
     * Register a plugin with Turbo Admin
     *
     * @param {TurboAdminPlugin} plugin
     */
    registerPlugin(plugin) {
        turboAdminLog('Registering plugin ' + plugin.name);
        this.plugins[plugin.name] = plugin;
    }

    /**
     * Register a palette search mode and its associated plugin
     *
     * this is usually bound to the searchMode, so
     *
     * @param {SearchMode} searchMode
     */
    registerSearchMode(searchMode) {
        turboAdminLog('Registering search mode with keyword ' + searchMode.keyword);
        // Don't use `this` as we are bound!
        globalThis.turboAdmin.searchModes[searchMode.keyword] = searchMode;
    }

    /**
     * Returns a string representation of the palette's keyboard shortcut
     *
     * @returns { String }
     */
    buildShortcutKeysString () {
        let keysString = '';
        let shortcut = this.options.shortcutKeys[0];

        if ( shortcut.meta ) {
            keysString += 'Cmd-';
        }
        if ( shortcut.ctrl ) {
            keysString += 'Ctrl-';
        }
        if ( shortcut.alt ) {
            keysString += 'Alt-';
        }
        if ( shortcut.shift ) {
            keysString += 'Shift-';
        }
        keysString += shortcut.key.toUpperCase();
        return keysString;
    }

}
