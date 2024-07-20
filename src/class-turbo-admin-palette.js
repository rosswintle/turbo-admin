/*
 * Some notes on how this works...
 *
 * paletteData is passed into the constructor and is the initial list of items
 * these are TurboAdminMenuItem objects
 *
 * At any point, buildPaletteItems() can be called to turn the paletteData
 * into an array of "li" nodes.
 *
 * updatePaletteItems inserts the paletteItems into the "ul" list and sets the
 * selectedElement
 *
 * The selectedItem is always one of the paletteItems
 *
 * paletteSearch rebuilds the paletteItems from the paletteData using
 * buildPaletteItems, and then filters the list with FuseJS
 */

import Fuse from './fuse-6.4.6.js';
import TurboAdminMenuItem from './types/class-turbo-admin-menu-item';
import ContentApi from './apis/class-content-api.js';
import SearchMode from './types/class-search-mode.js';
import ContentItem from './types/class-content-item.js';

export default class TurboAdminPalette {

	constructor(paletteData, options) {

		turboAdminLog('Initialising TurboAdmin');

        this.options = options;

        /** @type {HTMLDivElement} */
        this.paletteElement      = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-container'));
        /** @type {HTMLDivElement} */
        this.paletteInnerElement = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette'));
		/** @type {HTMLInputElement} */
        this.paletteInputElement = /** @type {HTMLInputElement} */ (document.getElementById('ta-command-palette-input'));
		/** @type {HTMLDivElement} */
        this.paletteItemsContainerElement = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-items-container'));
		/** @type {HTMLUListElement} */
        this.paletteItemsElement = /** @type {HTMLUListElement} */ (document.getElementById('ta-command-palette-items'));
		/** @type {HTMLDivElement} */
        this.paletteSubmenuContainerElement = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-submenu-container'));
        /** @type {HTMLDivElement} */
        this.paletteSearchModeTag = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-search-mode-tag'));
        /** @type {HTMLDivElement} */
        this.paletteSearchModeTabNotice = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-tab-notice'));
        /** @type {HTMLSpanElement} */
        this.paletteSearchModeTabNoticeText = /** @type {HTMLSpanElement} */ (document.getElementById('ta-command-palette-tab-notice-text'));
        /** @type {HTMLDivElement} */
        this.paletteNoticeElement = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-notice'));


        // Add a class if the menu needs refreshing with a visit to the Dashboard
        if (globalThis.turboAdmin.menuNeedsRefresh) {
            this.showPaletteNotice('Menu needs refreshing. Visit the Dashboard to refresh.');
        }

        // We need this when injecting items. We use it to help generate edit URLs. Not the best way but
        // works for now.
        /** @type {HTMLUListElement} */
        this.profileLinkElem = document.getElementById('wp-admin-bar-edit-profile');
        /** @type {null|String} */
        this.profileLink = null;
        if (this.profileLinkElem) {
            this.profileLink = this.profileLinkElem.querySelector('a').href;
        }

		// Get palette data
		this.paletteData = paletteData;

        // Backup of the palette data for use when we enter a different search mode
		this.paletteDataBackup = null;
		this.paletteItemsBackup = null;
        this.paletteItemIndexBackup = null;
        this.paletteInputValueBackup = null;

        // Current search modes/keyword
        this.searchMode = null;

        // paletteItems is the list of 'li' elements used to build the palette
        this.paletteItems = [];

        // itemIndex is a "cache" of URLs used to check if we already
        // have an item in the palette
        this.itemIndex = {};

        // Convert into LI elements
        this.buildPaletteItems();


		this.selectedItem = this.paletteItems[0];
        this.openedSubMenu = null;
        this.selectedSubItem = null;

		// Add them to the DOM
		this.updatePaletteItems();

        // Set state
        this.navigating = false;
        this.debounceTimeout;

		this.paletteFuseOptions = [];
		this.paletteFuse = null;

		if (typeof (Fuse) !== 'function') {
			return;
		}

		this.paletteFuseOptions = {
			keys: ['innerText'],
            shouldSort: true,
            // sortFn: (a, b) => {
            //     // Return search items first
            //     if (a.item[0].v.startsWith('Search: ')) {
            //         if (b.item[0].v.startsWith('Search: ')) {
            //             return b.score - a.score;
            //         }
            //         return -1;
            //     }
            //     if (b.item[0].v.startsWith('Search: ')) {
            //         return 1;
            //     }
            //     return a.score - b.score;
            // }
		}

		this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);

		document.addEventListener('keydown', e => this.handleGlobalKey(e));

		this.paletteElement.addEventListener('click', e => {
			this.checkForPaletteItemClick(e);
            this.checkForClickToClose(e);
		});

        this.paletteItemsElement.addEventListener('mouseover', e => {
            this.setHoveredItem(e.target);
        });
	}

    htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }

    isMac() {
        return navigator.platform.startsWith('Mac');
    }

    metaPressed(e) {
        return this.isMac() ? e.metaKey : e.ctrlKey;
    }

    inSearchMode() {
        return this.searchMode !== null;
    }

	/**
     * This converts this.paletteData into a list of paletteListItems in this.paletteItems
     *
     * It also builds the itemIndex
     */
    buildPaletteItems() {
        this.paletteItems = [];
        this.itemIndex = {};

		this.paletteData.forEach(item => {
			const li = document.createElement('li');
			const a = document.createElement('a');
            li.appendChild(a);
            if (item.actionType === 'url') {
                a.href = item.action;
                let title = item.title;
                if (item.parentTitle) {
                    title = item.parentTitle + ": " + title;
                }
                a.innerHTML = title;
            } else if (item.actionType === 'search-mode') {
                a.href = '#';
                a.innerHTML = item.title;
                li.dataset.actionType = item.actionType;
                li.dataset.searchMode = item.action.searchMode;
            }
            this.addPaletteListItem(li);
		});
	}

    // This takes a 'li' element and adds it to the paletteItems.
    // It also updates any caches and stuff.
    addPaletteListItem(listItem) {
        this.paletteItems.push(listItem);

        const link = listItem.querySelector('a');
        if (link) {
            this.itemIndex[link.href] = 1;
        }
    }

    contentItemExists(url) {
        return Boolean(this.itemIndex[url]);
    }

    /**
     * Clears and sets the content items
     *
     * @param {ContentItem[]} contentItems
     */
    setContentItems(contentItems) {
        this.paletteItems = [];
        this.itemIndex = [];
        this.injectContentItems(contentItems, false);
    }

    /**
     * Content items have:
     *  title
     *  subtype
     *  url
     *  (we should also make the sub-menu definable, but that's not done yet)
     *
     * @param {ContentItem[]} contentItems
     */
    injectContentItems(contentItems, andRunSearch = true) {
        turboAdminLog('Injecting items');

        if (contentItems.length > 0) {
            contentItems.forEach(this.injectItem.bind(this));
        }

        if (andRunSearch) {
            // Reset the search to work on the new items
            this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);
            this.paletteItems = this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);
        }

        this.updatePaletteItems();
    }

    /**
     * Injects a single content item into the palette
     *
     * @param {ContentItem} item
     */
    injectItem(item) {
        const itemTitle = item.title;
        // const itemTitle = item.title.rendered;
        const itemType = item.subtype;
        const itemUrl = item.url;

        // turboAdminLog('Adding item: ' + itemTitle);

        // // Check if item already exists
        if (this.contentItemExists(itemUrl)) {
            turboAdminLog('Not adding duplicate');
            return;
        }

        let title = itemTitle;

        if (itemType) {
            const itemTypeName = globalThis.contentApi.postTypes[itemType] ? globalThis.contentApi.postTypes[itemType].name : itemType;
            title += ` (${itemTypeName})`;
        }

        const li = document.createElement('li');
        const a = document.createElement('a');
        let subMenu = null;

        // Loop over submenu items OR add link.
        if (item.submenuItems.length > 0) {

            // Prepare the outer sub-menu elements
            subMenu = document.createElement('div');
            const subMenuTitle = document.createElement('div');
            const subMenuItems = document.createElement('ul');
            subMenu.classList.add('ta-submenu');
            subMenuTitle.classList.add('ta-submenu-title');

            subMenuTitle.textContent = this.htmlDecode(itemTitle);
            subMenuItems.classList.add('ta-submenu-items');
            subMenu.appendChild(subMenuTitle);

            for (let i = 0; i < item.submenuItems.length; i++) {
                const subMenuItem = item.submenuItems[i]
                // TODO: Abstract this so sub-menus can be defined by plugins?
                const subMenuListItem = document.createElement('li');
                const subMenuLink = document.createElement('a');
                subMenuLink.innerText = subMenuItem.title;
                subMenuLink.href = subMenuItem.url;
                for (let a = 0; a < subMenuItem.attributes.length; a++) {
                    subMenuLink.setAttribute(
                        subMenuItem.attributes[a].name,
                        subMenuItem.attributes[a].value
                    )
                }
                subMenuListItem.appendChild(subMenuLink);
                subMenuItems.appendChild(subMenuListItem);
            }

            // Add the sub-menu items UL to the sub-menu element.
            subMenu.appendChild(subMenuItems);

            li.classList.add('ta-has-child-menu');
        }

        a.href = itemUrl;
        a.innerHTML = title;

        li.appendChild(a);
        if (subMenu !== null) {
            li.appendChild(subMenu);
        }

        this.addPaletteListItem(li);
    }

	/**
     * Handle global keypresses (at document level). Note that other key presses
     * are handled by paletteActions()
     *
     * @param {KeyboardEvent} e
     */
    async handleGlobalKey(e) {
		if (this.shortcutKeysPressed(e)) {
            e.preventDefault();
            e.stopPropagation();
			if (this.paletteShown()) {
				this.hidePalette();
			} else {
				this.showPalette();
			}
            return;
		}

		if (e.code === 'Escape' && this.paletteShown()) {
			if (this.isSubMenuOpen()){
                this.closeSubMenu();
            } else if (this.inSearchMode()) {
                this.leaveSearchMode();
            } else {
                this.hidePalette();
            }
            return;
		}

        if (this.paletteShown()) {
            await this.paletteActions(e);
		}
	}

	shortcutKeysPressed(keyEvent) {
        // The reduce here works through all the different possible key combos
        // (more than one can be specified in options)
		const keysPressed = this.options.shortcutKeys.reduce(
			(keyPressed, combo) => {
				if (keyPressed) {
					return keyPressed;
				}
                return ((!navigator.platform.startsWith('Mac')) || (combo.meta === keyEvent.metaKey))
                    && (combo.alt === keyEvent.altKey)
                    && (combo.shift === keyEvent.shiftKey)
                    && (combo.ctrl === keyEvent.ctrlKey)
                    && (
                        keyEvent.code === 'Key' + combo.key.toUpperCase()
                        || ( combo.key === ' ' && keyEvent.code.toUpperCase() === 'SPACE' )
                    );
            }, false);
		return keysPressed;
	}

    /*
     * Adds the tab hint for a keyword once it has been typed.
     */
    maybeHighlightInputKeyword(newKey) {
        // Do nothing if we are in a search-mode
        if (this.inSearchMode()) {
            return;
        }

        // This is fired on "keyDown", so the value isn't update with the new key yet.
        // But don't do this for special keys, and catch backspace too.
        let newInputValue = this.paletteInputElement.value;
        if (newKey.length === 1) {
            newInputValue += newKey;
        }
        if (newKey === 'Backspace') {
            newInputValue = newInputValue.slice(0, -1);
        }
        // turboAdminLog(`Checking palette input value ${newInputValue} for keyword`);
        if (this.isKeyword(newInputValue)) {
            this.paletteSearchModeTabNoticeText.innerText = `Search for ${newInputValue}`;
            this.paletteSearchModeTabNotice.classList.add('active');
        } else {
            this.unhighlightInputKeyword();
        }
    }

    unhighlightInputKeyword() {
        this.paletteSearchModeTabNotice.classList.remove('active');
    }

    async debouncedPaletteSearchAndUpdate() {
        // If we're not in a search mode then search immediately
        if (! this.inSearchMode()) {
            this.debounceTimeout = null;
            await this.paletteSearchAndUpdate();
            return;
        }

        // If timer is null, reset it to 500ms and run your functions.
        // Otherwise, wait until timer is cleared

        // Cancel the existing timeout
        clearTimeout(this.debounceTimeout)

        this.debounceTimeout = setTimeout(async function () {
            // Reset timeout
            this.debounceTimeout = null;

            // Run the search function
            await this.paletteSearchAndUpdate();
        }.bind(this), 750);
    }

    /**
     * Check if a string is a search mode keyword
     *
     * @param {string} inputString
     * @returns {boolean}
     */
    isKeyword(inputString) {
        return Object.keys(globalThis.turboAdmin.searchModes).includes(inputString);
    }

    /**
     * Show the palette notice with the specified text
     *
     * @param {string} text
     */
    showPaletteNotice(text) {
        this.paletteNoticeElement.classList.add('active');
        this.paletteNoticeElement.innerText = text;
    }

    /**
     * Hide the palette notice
     */
    hidePaletteNotice() {
        this.paletteNoticeElement.classList.remove('active');
    }

	/**
     * Handle (non-global) keypresses on the palette
     *
     * @param {KeyboardEvent} e
     * @returns {Promise}
     */
    async paletteActions(e) {
		if (e.code === 'ArrowDown' && this.paletteShown()) {
			e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
			this.moveDown();
			return;
		}
		if (e.code === 'ArrowUp' && this.paletteShown()) {
			e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
			this.moveUp();
			return;
		}
		if (e.code === 'Enter' && this.paletteShown()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.doAction(this.metaPressed(e));
            return;
		}

        /*
         * Only the actions above can be done in sub-menus.
         */
        if (this.isSubMenuOpen()) {
            return;
        }

        /*
         * Check for a keyword being typed and add a UI hint.
         */
        this.maybeHighlightInputKeyword(e.key);

        /*
         * Tabbing looks for a search mode keyword.
         */
        if (! this.inSearchMode() && (e.code === 'Tab' || e.key === ':')) {
            turboAdminLog('Checking for search mode');
            let inputValue = this.paletteInputElement.value;
            if (this.isKeyword(inputValue)) {
                turboAdminLog('Found search mode ' + inputValue)
                e.preventDefault();
                await this.enterSearchMode(
                    globalThis.turboAdmin.searchModes[inputValue]);
                return;
            }
        }

        /*
         * Backspace may exit us from a search mode
         */
        if (this.inSearchMode() && e.code === 'Backspace' && this.paletteInputElement.value === '') {
            e.preventDefault();
            this.leaveSearchMode();
            return;
        }

		await this.debouncedPaletteSearchAndUpdate();
	}

    /**
     * Puts the palette into a specific search mode - used when a keyword is selected
     *
     * @param {SearchMode} searchMode
     */
    async enterSearchMode(searchMode) {
        turboAdminLog('Entering search mode for keyword ' + searchMode.keyword);
        this.backupPaletteData();

        this.paletteData = [];
        this.paletteItems = [];
        this.itemIndex = [];

        // Remove the notice if it's there
        this.hidePaletteNotice();

        this.searchMode = searchMode;
        this.paletteInputElement.value = '';
        this.addSearchModeTag(searchMode.displayName);
        this.unhighlightInputKeyword();
        this.updatePaletteItems();
        // This is similar to code in paletteSearch - maybe we could extract/abstract it?
        if (searchMode.defaultItemsCallback !== null) {
            this.paletteInnerElement.classList.add('loading');
            const results = await searchMode.defaultItemsCallback();
            this.setContentItems(results);
            // this.injectContentItems(results);
            this.paletteInnerElement.classList.remove('loading');
        }
    }

    /**
     * Puts the palette into a specific search mode specified by a keyword
     *
     * @param {string} keyword
     */
    async enterSearchModeByKeyword(keyword) {
        turboAdminLog('Entering search mode by keyword ' + keyword);
        const searchMode = globalThis.turboAdmin.searchModes[keyword];
        turboAdminLog('Search mode is ' + searchMode);
        if (searchMode === undefined) {
            return;
        }
        await this.enterSearchMode(searchMode);
    }

    /**
     * Leaves the current search mode
     */
    leaveSearchMode() {
        const searchMode = this.searchMode;
        // It's important what we set this to - see inSearchMode()
        this.searchMode = null;
        this.removeSearchModeTag();
        this.restorePaletteData();
    }

    /**
     * Backups up the palette data and input value to local variables so that it can be
     * restored later.
     */
    backupPaletteData() {
        this.paletteDataBackup = this.paletteData;
        this.paletteItemsBackup = this.paletteItems;
        this.paletteItemIndexBackup = this.itemIndex;
        this.paletteInputValueBackup = this.paletteInputElement.value;
    }

    /**
     * Restores the save palette data - highlights and rebuilds
     */
    restorePaletteData() {
        this.paletteData = this.paletteDataBackup;
        this.paletteItems = this.paletteItemsBackup;
        this.itemIndex = this.paletteItemIndexBackup;
        this.paletteInputElement.value = this.paletteInputValueBackup;
        this.maybeHighlightInputKeyword('');
        this.paletteSearchAndUpdate();
    }

    /**
     * Adds the search mode tag with the specified title.
     *
     * @param {string} title
     */
    addSearchModeTag(title) {
        this.paletteSearchModeTag.classList.add('active');
        this.paletteSearchModeTag.innerText = title;
    }

    /**
     * Removes the search mode tag
     */
    removeSearchModeTag() {
        this.paletteSearchModeTag.classList.remove('active');
    }

    isPaletteOpen() {
        return this.paletteElement?.classList.contains('active');
    }

	showPalette() {
        // Bail if already shown (this can be triggered by a focus event)
        if (this.isPaletteOpen()) {
            return;
        }

        this.paletteInputElement.value = '';
		this.paletteInputElement?.focus();
		this.paletteElement?.classList.add('active');
        // This is needed in admin-bar mode otherwise it gets a weird already-scrolled thing when
        // the palette opens.
        setTimeout(() => this.paletteItemsElement.scrollTop = 0, 100);
	}

	hidePalette() {
        this.navigating = false;
		this.paletteElement?.classList.remove('active');
        this.paletteInputElement.value = '';
        this.paletteInputElement.blur();
        if (this.isSubMenuOpen()) {
            this.closeSubMenu();
        }
        if (this.searchMode !== null) {
            this.leaveSearchMode();
        }
	}

	paletteShown() {
		return this.paletteElement?.classList.contains('active');
	}

    checkForPaletteItemClick(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            if (this.isSubMenuOpen()) {
                this.selectedSubItem = e.target.closest('li');
            } else {
                this.selectedItem = e.target.closest('li');
            }
            this.setSelectedElement();

            this.doAction(this.metaPressed(e));
        }
    }

	checkForClickToClose(e) {
		if (e.target.id === this.paletteElement.id) {
			this.hidePalette();
		}
	}

	setSelectedElement() {
        if (this.isSubMenuOpen()) {
            this.paletteSubmenuContainerElement?.querySelectorAll('.ta-submenu li.selected')?.forEach(e => e.classList.remove('selected'));
            this.selectedSubItem.classList.add('selected');
        } else {
            this.paletteItemsElement?.querySelectorAll('li.selected')?.forEach(e => e.classList.remove('selected'));
            if (this.selectedItem) {
                this.selectedItem.classList.add('selected');
                this.scrollList();
            }
        }
	}

	scrollList() {
		// Scrolling up
		if (this.selectedItem.offsetTop < this.paletteItemsElement.scrollTop) {
			this.paletteItemsElement.scrollTop = this.selectedItem.offsetTop;
		}
		// Scrolling down
		if (this.selectedItem.offsetTop + this.selectedItem.offsetHeight > this.paletteItemsElement.offsetHeight + this.paletteItemsElement.scrollTop) {
			this.paletteItemsElement.scrollTop = this.selectedItem.offsetTop + this.selectedItem.offsetHeight - this.paletteItemsElement.offsetHeight;
		}
	}

    setHoveredItem(element) {
        // Only do this for li's
        if ('LI' === element.tagName) {
            this.navigating = true;
            if (this.isSubMenuOpen()) {
                this.selectedSubItem = element;
            } else {
                this.selectedItem = element;
            }
            this.setSelectedElement();
        }
    }

	moveDown() {
        if (this.isSubMenuOpen()) {
            const nextItem = this.selectedSubItem.nextElementSibling;
            this.navigating = true;
            if (nextItem) {
                this.selectedSubItem = nextItem;
                this.setSelectedElement();
            }
        } else {
            const nextItem = this.selectedItem.nextElementSibling;
            this.navigating = true;
            if (nextItem) {
                this.selectedItem = nextItem;
                this.setSelectedElement();
            }
        }
	}

	moveUp() {
        if (this.isSubMenuOpen()) {
            const prevItem = this.selectedSubItem.previousElementSibling;
            this.navigating = true;
            if (prevItem) {
                this.selectedSubItem = prevItem;
                this.setSelectedElement();
            }
        } else {
            const prevItem = this.selectedItem.previousElementSibling;
            this.navigating = true;
            if (prevItem) {
                this.selectedItem = prevItem;
                this.setSelectedElement();
            }
        }
    }

    isSubMenuOpen() {
        return null !== this.openedSubMenu;
    }

    openSubMenu(subMenuElement) {
        this.paletteSubmenuContainerElement.replaceChildren(subMenuElement);
        // Set height in case main menu is smaller than sub menu
        const subMenuHeight = this.paletteSubmenuContainerElement.offsetHeight;
        this.paletteItemsContainerElement.style.minHeight = subMenuHeight + "px";
        this.paletteSubmenuContainerElement.classList.add('active');

        this.selectedSubItem = subMenuElement.querySelector('li');
        this.openedSubMenu = subMenuElement;
        this.setSelectedElement();

        this.paletteInputElement.disabled = true;
        // Blur the input so that keys can continue to be captured
        this.paletteInputElement.blur();
    }

    closeSubMenu(subMenuElement = null) {
        if (null === subMenuElement) {
            subMenuElement = document.querySelector('.ta-submenu.active');
        }
        this.paletteSubmenuContainerElement.classList.remove('active');
        this.selectedSubItem.classList.remove('active');
        this.paletteItemsContainerElement.style.minHeight = 'auto';
        this.selectedSubItem = null;
        this.openedSubMenu = null;
        this.paletteInputElement.disabled = false;
        this.paletteInputElement.focus();
    }

	doAction(metaPressed = false) {
        if (this.isSubMenuOpen()) {
            this.actOnItem(this.selectedSubItem, metaPressed);
            return;
        }
        if (this.selectedItem.classList.contains('ta-has-child-menu')) {
            const subMenu = this.selectedItem.querySelector('.ta-submenu');
            this.openSubMenu(subMenu);
            return;
        }
        if (this.selectedItem.dataset.actionType === 'search-mode') {
            this.enterSearchModeByKeyword(this.selectedItem.dataset.searchMode);
            return;
        }

        this.actOnItem(this.selectedItem, metaPressed);
    }

    actOnItem(item, metaPressed) {
        this.hidePalette();
        const link = item.querySelector('a');
        const url = link.href;

        // link.href will be interpolated by the browser, so if it's empty it will be the current page
        // use getAttribute instead to work out if its empty
        if (link.getAttribute('href') === '') {
            return;
        }

        if ('clipboard' === link.dataset.action) {
            navigator.clipboard.writeText(url);
            return;
        }

        if (metaPressed) {
            window.open(url, '_blank');
        } else {
            window.location = url;
        }
    }

	selectedItemDisplayed() {
		return Array.from(this.paletteItemsElement.childNodes).includes(this.selectedItem);
	}

	async paletteSearchAndUpdate() {
		await this.paletteSearch();
		this.updatePaletteItems();
	}

	async paletteSearch() {
        // Get the value...
        // const response = await globalThis.contentApi.get('posts', { search: this.paletteInputElement.value, per_page: 100, status: ['publish', 'future', 'draft', 'pending', 'private'] });

        if (! this.searchMode) {
            this.buildPaletteItems();

            if (this.paletteInputElement.value !== '') {
                // Reset the search to work on the new items
                this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);
                this.paletteItems = this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);
            }
            return;
        }

        if (this.paletteInputElement.value.length === 0) {
            this.paletteInnerElement.classList.add('loading');
            let results = [];
            if (this.searchMode.defaultItemsCallback !== null) {
                results = await this.searchMode.defaultItemsCallback();
            }
            this.setContentItems(results);
            // this.injectContentItems(results);
            this.paletteInnerElement.classList.remove('loading');
        } else {
            // This is copied to enterSearchMode. Should probably be extracted.
            this.paletteInnerElement.classList.add('loading');
            const results = await this.searchMode.searchCallback(this.paletteInputElement.value);
            this.setContentItems(results);
            // this.injectContentItems(results);
            this.paletteInnerElement.classList.remove('loading');
        }

        /**
         * OLD CODE BELOW
         */
        // Content search - don't search everything!
        // if (globalThis.contentApi.active && this.postTypes !== [] && this.paletteInputElement.value.length > 2) {
        //     this.paletteInnerElement.classList.add('loading');

        //     globalThis.contentApi.getPosts(this.paletteInputElement.value)
        //         .then(
        //             results => {
        //                     this.injectContentItems(results);
        //                     this.paletteInnerElement.classList.remove('loading');
        //             }
        //         )
        // }
	}

	updatePaletteItems() {
		const newItems = document.createElement('ul');
		newItems.id = 'ta-command-palette-items';

		this.paletteItems.forEach(i => {
			newItems.appendChild(i);
		})

		this.paletteItemsElement.replaceChildren(...newItems.children);

		if (!this.navigating || !this.selectedItemDisplayed()) {
			this.selectedItem = this.paletteItems[0];
		}

		this.setSelectedElement();
	}

}
