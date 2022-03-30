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
import TurboAdminMenuItem from './class-turbo-admin-menu-item.js';
import Acf from './class-acf.js';
import TurboAdminWpBlockEditorFullscreenKill from './class-turbo-admin-wp-block-editor-fullscreen-kill.js';
import TurboAdminWpBlockEditorWelcomeGuideKill from './class-turbo-admin-wp-block-editor-welcome-guide-kill.js';
import TurboAdminWpNotices from './class-turbo-admin-wp-notices.js';
import TurboAdminListTableShortcuts from './class-list-table-shortcuts.js';

export default class TurboAdmin {

    constructor(options) {
        if (document.getElementById('ta-command-palette-container')) {
            console.log('TurboAdmin already initialised - I won\'t make a second copy!');
            return;
        }

        this.options = options;
    }

    async init() {
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
                // Get from localStorage
                const savedMenu = window.localStorage.getItem('ta-palette-data');

                if (null !== savedMenu) {
                    // Check for .logged-in class on body
                    if (document.body.classList.contains('logged-in')) {
                        // If still logged in merge (?) the items
                        this.menu = JSON.parse(savedMenu);
                    }
                }
            }
        } else {
            // On the back end, get the WordPress dashboard menu items
            this.menu = this.getMenu();
        }

        // Add other additional items
        this.addAdditionalMenuItems();
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

    addAdditionalMenuItems() {

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
        let extraItems = this.options.extraItems ?? [];

        // Merge in defaults
        extraItems = extraItems.concat(
            [
                {
                    'detectType': 'dom',
                    'detectSelector': 'body.wp-admin #wp-admin-bar-view-site a',
                    'itemTitleFunction': () => 'View/visit site',
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-dashboard a',
                    'itemTitleFunction': (element) => element.textContent,
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wpadminbar',
                    'itemTitleFunction': () => 'Logout',
                    'itemUrlFunction': () => document.getElementById('wp-admin-bar-logout')?.querySelector('a')?.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-edit a',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href,
                    'noCache': true,
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-view a',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href,
                    'noCache': true,
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-new-content .ab-submenu a',
                    'itemTitleFunction': (item) => 'New ' + item.textContent,
                    'itemUrlFunction': (item) => item.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-customize a',
                    'itemTitleFunction': (item) => item.textContent,
                    'itemUrlFunction': (item) => item.href
                },
                {
                    'detectType': 'dom',
                    'detectSelectorNone': '#wpadminbar, #loginform',
                    'itemTitleFunction': () => "Log in",
                    'itemUrlFunction': () => {
                        if (globalThis.taWp.home) {
                            return globalThis.taWp.siteUrl;
                        }
                        // Try getting wp-admin
                        return 'javascript:alert(\'Sorry, could not detect login URL.\')';
                    }
                },
                // This is on the login screen
                {
                    'detectType': 'dom',
                    'detectSelector': '#backtoblog a',
                    'itemTitleFunction': () => "View/visit site",
                    'itemUrlFunction': (element) => element.href
                },
                // Multisite items
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-network-admin > a',
                    'itemTitleFunction': () => "Network Admin",
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-network-admin .ab-submenu a',
                    'itemTitleFunction': (element) => 'Network Admin: ' + element.textContent,
                    'itemUrlFunction': (element) => element.href
                },
                {
                    'detectType': 'dom',
                    'detectSelector': '#wp-admin-bar-my-sites #wp-admin-bar-my-sites-list .ab-submenu a',
                    'itemTitleFunction': (element) => "Sites: " + element.closest('.menupop').querySelector('a').innerText + ' - ' + element.innerText,
                    'itemUrlFunction': (element) => element.href
                },
                // Oxygen builder items
                {
                    'detectType': 'dom',
                    'detectSelector': '#ct-edit-template-builder',
                    'itemTitleFunction': () => 'Edit with Oxygen',
                    'itemUrlFunction': (element) => element.href,
                    'noCache': true
                },
                // It's worth noting that the Oxygen Builder doesn't use a /wp-admin URL
                // and so kinda appears to Turbo Admin to be a "front-end" page and it
                // doesn't refresh the menu items.
                {
                    'detectType': 'dom',
                    'detectSelector': '.oxygen-back-to-wp-menu .oxygen-toolbar-button-dropdown a:not(:last-of-type)',
                    'itemTitleFunction': (element) => 'Back to WP: ' + element.textContent,
                    'itemUrlFunction': (element) => {
                        if (element.href) {
                            return element.href;
                        } else {
                            let url = new URL(window.location.href);
                            return url.origin + url.pathname;
                        }
                    },
                    'noCache': true
                }
            ]
        );

        extraItems.forEach(item => {
            let detected = false;
            let elements = null;
            if (item.detectType === 'url') {
                detected = Boolean(window.location.href.includes(item.detectPattern));
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
                const newItem = new TurboAdminMenuItem(item.itemTitleFunction(element), item.itemUrlFunction(element), '', item?.noCache);
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

    addPalette() {
        // Container
        const container = document.createElement('div');
        container.id = 'ta-command-palette-container';
        // Palette
        const palette = document.createElement('div');
        palette.id = 'ta-command-palette';
        // Input field
        const input = document.createElement('input');
        input.id = "ta-command-palette-input";
        input.name = "ta-command-palette-input";
        input.type = "text";
        // Set this to stop stuff trying to fill it.
        input.setAttribute('autocomplete', 'off');
        // List
        const list = document.createElement('ul');
        list.id = "ta-command-palette-items";
        // Join it all up
        container.appendChild(palette);
        palette.appendChild(input);
        palette.appendChild(list);

        document.querySelector(this.options.appendToElement ?? 'body').appendChild(container);
    }

}
