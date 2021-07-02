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

export default class TurboAdminPalette {

	constructor(paletteData, options) {

		console.log('Initialising TurboAdmin');

		this.options = options;

		this.paletteElement = document.getElementById('ta-command-palette-container');
		this.paletteInputElement = document.getElementById('ta-command-palette-input');
		this.paletteItemsElement = document.getElementById('ta-command-palette-items');

		// Get palette data
		this.paletteData = paletteData;

		// Convert into LI elements
		this.paletteItems = this.buildPaletteItems();
		this.selectedItem = this.paletteItems[0];
		// Add them to the DOM
		this.updatePaletteItems();

		// Set state
		this.navigating = false;

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

		this.paletteInputElement.addEventListener('keydown', e => {
			this.paletteActions(e);
		});

		this.paletteElement.addEventListener('click', e => {
			this.checkForPaletteItemClick(e);
			this.checkForClickToClose(e);
		});
	}

	isMac() {
		return navigator.platform.startsWith('Mac');
	}

	metaPressed(e) {
		return this.isMac() ? e.metaKey : e.ctrlKey;
	}

	buildPaletteItems() {
		const paletteItems = [];

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
			paletteItems.push(li);
		});

		return paletteItems;
	}

	handleGlobalKey(e) {
		if (this.shortcutKeysPressed(e)) {
			if (this.paletteShown()) {
				this.hidePalette();
			} else {
				this.showPalette();
			}
		}

		if (e.code === 'Escape' && this.paletteShown()) {
			this.hidePalette();
		}
		// Disable keyUp and keyDown if palette shown
		if ((e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') && this.paletteShown()) {
			e.preventDefault();
		}
	}

	shortcutKeysPressed(keyEvent) {
		const keysPressed = this.options.shortcutKeys.reduce(
			(keyPressed, combo) => {
				if (keyPressed) {
					return keyPressed;
				}
				if (navigator.platform.startsWith('Mac')) {
					if (combo.meta && !keyEvent.metaKey) {
						return false;
					}
				}
				if (combo.alt && !keyEvent.altKey) {
					return false;
				}
				if (combo.shift && !keyEvent.shiftKey) {
					return false;
				}
				if (combo.ctrl && !keyEvent.ctrlKey) {
					return false;
				}
				if ('Key' + combo.key.toUpperCase() !== keyEvent.code) {
					return false;
				}
				return true;
			}, false);
		return keysPressed;
	}

	paletteActions(e) {
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
		}
		this.paletteSearchAndUpdate();
	}

	showPalette() {
		this.paletteInputElement.value = '';
		this.paletteElement?.classList.add('active');
		this.paletteInputElement?.focus();
	}

	hidePalette() {
		this.navigating = false;
		this.paletteElement?.classList.remove('active');
	}

	paletteShown() {
		return this.paletteElement?.classList.contains('active');
	}

	checkForPaletteItemClick(e) {
		if (e.target.tagName === 'A') {
			e.preventDefault();
			this.selectedItem = e.target.closest('li');
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
		this.paletteItemsElement?.querySelectorAll('li.selected')?.forEach(e => e.classList.remove('selected'));

		if (this.selectedItem) {
			this.selectedItem.classList.add('selected');
			this.scrollList();
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

	moveDown() {
		const nextItem = this.selectedItem.nextElementSibling;
		this.navigating = true;
		if (nextItem) {
			this.selectedItem = nextItem;
			this.setSelectedElement();
		}
	}

	moveUp() {
		const prevItem = this.selectedItem.previousElementSibling;
		this.navigating = true;
		if (prevItem) {
			this.selectedItem = prevItem;
			this.setSelectedElement();
		}
	}

	doAction(metaPressed = false) {
		this.hidePalette();

		const url = this.selectedItem.querySelector('a').href;

		if (metaPressed) {
			window.open(url, '_blank');
		} else {
			window.location = this.selectedItem.querySelector('a').href;
		}
	}

	selectedItemDisplayed() {
		return Array.from(this.paletteItemsElement.childNodes).includes(this.selectedItem);
	}

	paletteSearchAndUpdate() {
		this.paletteSearch();
		this.updatePaletteItems();
	}

	paletteSearch() {
		this.paletteItems = this.buildPaletteItems();
		if (this.paletteInputElement.value !== '') {
			this.paletteItems = this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);
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
