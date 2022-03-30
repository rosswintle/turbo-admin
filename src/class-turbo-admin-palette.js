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
import TurboAdminMenuItem from './class-turbo-admin-menu-item';
import ContentApi from './class-content-api.js';

export default class TurboAdminPalette {

	constructor(paletteData, options) {

		console.log('Initialising TurboAdmin');

        this.options = options;

        /** @type {HTMLDivElement} */
        this.paletteElement      = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette-container'));
        /** @type {HTMLDivElement} */
        this.paletteInnerElement = /** @type {HTMLDivElement} */ (document.getElementById('ta-command-palette'));
		/** @type {HTMLInputElement} */
        this.paletteInputElement = /** @type {HTMLInputElement} */ (document.getElementById('ta-command-palette-input'));
		/** @type {HTMLUListElement} */
        this.paletteItemsElement = /** @type {HTMLUListElement} */ (document.getElementById('ta-command-palette-items'));

		// Get palette data
		this.paletteData = paletteData;

        // Get post type data from API
        this.postTypes = [];
        this.fetchPostTypes();

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

    fetchPostTypes() {
        if (! globalThis.contentApi.active) {
            this.postTypes = [];
            return;
        }

        globalThis.contentApi.get('types').then(
            response => {
                response.json().then(
                    types => {
                        this.postTypes = types;
                    }
                );
            }
        );
    }

	buildPaletteItems() {
        this.paletteItems = [];
        this.itemIndex = {};

		this.paletteData.forEach(item => {
			const li = document.createElement('li');
			const a = document.createElement('a');
			li.appendChild(a);
			a.href = item.action;
			let title = item.title;
			if (item.parentTitle) {
				title = item.parentTitle + ": " + title;
			}
			a.innerHTML = title;
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

    injectContentItems(contentItems) {
        console.log('Injecting items');

        // We'll need this in the loop below.
        const profileLinkElem = document.getElementById('wp-admin-bar-edit-profile');
        let profileLink = null;
        if (profileLinkElem) {
            profileLink = profileLinkElem.querySelector('a').href;
        }

        // TODO: Can we not do this on every content item inject?
        // Check for presence of Oxygen Page builder
        /** @type {HTMLElement|string|Number} */
        let oxygenLinkElem = document.getElementById('toplevel_page_ct_dashboard_page');
        // Also check for a menu bar item
        if (! oxygenLinkElem) {
            oxygenLinkElem = document.getElementById('wp-admin-bar-oxygen_admin_bar_menu');
        }
        // Check to see if Oxygen link is cached
        if (! oxygenLinkElem) {
            oxygenLinkElem = Number(window.localStorage.getItem('ta-has-oxygen-builder'));
        }
        // Save Oxygen builder status
        window.localStorage.setItem('ta-has-oxygen-builder', Boolean(oxygenLinkElem) ? '1' : '0' );

        if (contentItems.length > 0) {
            contentItems.forEach(item => {
                const itemTitle = item.title;
                // const itemTitle = item.title.rendered;
                const itemType = item.subtype;
                const itemUrl = item.url;

                // console.log('Adding item: ' + itemTitle);

                // // Check if item already exists
                if (this.contentItemExists(itemUrl)) {
                    console.log('Not adding duplicate');
                    return;
                }

                const itemTypeName = this.postTypes[itemType] ? this.postTypes[itemType].name : itemType;
                const title = `${itemTitle} (${itemTypeName})`;

                const li = document.createElement('li');
                const a = document.createElement('a');
                const subMenu = document.createElement('div');
                const subMenuTitle = document.createElement('div');
                const subMenuItems = document.createElement('ul');
                subMenu.classList.add('ta-submenu');
                subMenuTitle.classList.add('ta-submenu-title');

                subMenuTitle.textContent = this.htmlDecode(itemTitle);
                subMenuItems.classList.add('ta-submenu-items');
                subMenu.appendChild(subMenuTitle);
                subMenu.appendChild(subMenuItems);

                const subMenuItem1 = document.createElement('li');
                const subMenuLink1 = document.createElement('a');
                subMenuLink1.innerText = "View";
                subMenuLink1.href = itemUrl;
                subMenuItem1.appendChild(subMenuLink1);
                subMenuItems.appendChild(subMenuItem1);

                if (profileLink) {
                    // Need to get edit URL. This seems like the best way for now.
                    const editLink = profileLink.replace('profile.php', `post.php?post=${item.id}&action=edit`);

                    const subMenuItem2 = document.createElement('li');
                    const subMenuLink2 = document.createElement('a');
                    subMenuLink2.innerText = "Edit";
                    subMenuLink2.href = editLink;
                    subMenuItem2.appendChild(subMenuLink2);
                    subMenuItems.appendChild(subMenuItem2);
                }

                if (oxygenLinkElem) {
                    // Oxygen Edit Links are like: https://example.com.com/?page_id=26&ct_builder=true&ct_inner=true
                    const oxygenLink = globalThis.taWp.home + `?page_id=${item.id}&ct_builder=true&ct_inner=true`;

                    const subMenuItem3 = document.createElement('li');
                    const subMenuLink3 = document.createElement('a');
                    subMenuLink3.innerText = "Edit with Oxygen";
                    subMenuLink3.href = oxygenLink;
                    subMenuItem3.appendChild(subMenuLink3);
                    subMenuItems.appendChild(subMenuItem3);
                }

                const subMenuItem3 = document.createElement('li');
                const subMenuLink3 = document.createElement('a');
                subMenuLink3.innerText = "Copy link";
                // Because this is an href we're setting it gets URI encoded!
                subMenuLink3.href = itemUrl;
                subMenuLink3.setAttribute('data-action', 'clipboard');
                subMenuItem3.appendChild(subMenuLink3);
                subMenuItems.appendChild(subMenuItem3);


                li.classList.add('ta-has-child-menu');

                li.appendChild(a);
                li.appendChild(subMenu);

                a.href = itemUrl;
                a.innerHTML = title;
                this.addPaletteListItem(li);
            })
        }

        // Reset the search to work on the new items
        this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);
        this.paletteItems = this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);

        this.updatePaletteItems();
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
		}

		if (e.code === 'Escape' && this.paletteShown()) {
			if (this.isSubMenuOpen()){
                this.closeSubMenu();
            } else {
                this.hidePalette();
            }
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

    async debouncedPaletteSearchAndUpdate() {
        // If search string is not long enough for content search, then
        // run without debounce.
        if (
            ( this.paletteInputElement.value !== '' && this.paletteInputElement.value.length <= 2)
            || this.postTypes === [] ) {
            this.debounceTimeout = null;
            await this.paletteSearchAndUpdate();
            return;
        }
        // If timer is null, reset it to 500ms and run your functions.
        // Otherwise, wait until timer is cleared
        if (!this.debounceTimeout) {
            this.debounceTimeout = setTimeout(async function () {
                // Reset timeout
                this.debounceTimeout = null;

                // Run the search function
                await this.paletteSearchAndUpdate();
            }.bind(this), 750);
        }
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
			this.moveDown();
			return;
		}
		if (e.code === 'ArrowUp' && this.paletteShown()) {
			e.preventDefault();
			this.moveUp();
			return;
		}
		if (e.code === 'Enter' && this.paletteShown()) {
            this.doAction(this.metaPressed(e));
            return;
		}
        if (this.isSubMenuOpen()) {
            return;
        }
		await this.debouncedPaletteSearchAndUpdate();
	}

	showPalette() {
		this.paletteInputElement.value = '';
        this.paletteItemsElement.scrollTop = 0;
		this.paletteElement?.classList.add('active');
		this.paletteInputElement?.focus();
	}

	hidePalette() {
        this.navigating = false;
		this.paletteElement?.classList.remove('active');
        this.paletteInputElement.value = '';
        this.paletteInputElement.blur();
        if (this.isSubMenuOpen()) {
            this.closeSubMenu();
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
            this.paletteItemsElement?.querySelectorAll('.ta-submenu.active li.selected')?.forEach(e => e.classList.remove('selected'));
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
        // Set height in case main menu is smaller than sub menu
        const subMenuHeight = subMenuElement.offsetHeight;
        this.paletteItemsElement.style.minHeight = subMenuHeight + "px";
        subMenuElement.classList.add('active');


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
        subMenuElement.classList.remove('active');
        this.selectedSubItem.classList.remove('active');
        this.paletteItemsElement.style.minHeight = 'auto';
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

        this.actOnItem(this.selectedItem, metaPressed);
    }

    actOnItem(item, metaPressed) {
        this.hidePalette();
        const link = item.querySelector('a');
        const url = link.href;

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

        this.buildPaletteItems();

        if (this.paletteInputElement.value !== '') {
            // Reset the search to work on the new items
            this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);
            this.paletteItems = this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);
        }

        // Content search - don't search everything!
        if (globalThis.contentApi.active && this.postTypes !== [] && this.paletteInputElement.value.length > 2) {
            this.paletteInnerElement.classList.add('loading');

            globalThis.contentApi.getPosts(this.paletteInputElement.value)
                .then(
                    results => {
                            this.injectContentItems(results);
                            this.paletteInnerElement.classList.remove('loading');
                    }
                )
        }
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
