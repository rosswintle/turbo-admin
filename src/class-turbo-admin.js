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

export default class TurboAdmin {

	constructor(paletteData) {

		console.log('Initialising TurboAdmin');

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
			this.checkForClickToClose(e);
		});
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
		// console.log(e.code);
		if (e.code === 'KeyP' && this.metaKeysPressed(e)) {
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
			this.doAction();
		}
		this.paletteSearchAndUpdate();
	}

	metaKeysPressed(e) {
		// On mac, Cmd is metaKey.
		// Probably need to detect Ctrl on Windows
		if (navigator.platform.startsWith('Mac')) {
			return (e.metaKey && e.shiftKey && e.altKey);
		} else {
			return (e.ctrlKey && e.shiftKey && e.altKey);
		}
	}

	showPalette() {
		this.paletteInputElement.value = '';
		this.paletteElement?.classList.add('active');
		this.paletteInputElement?.focus();
	}

	hidePalette() {
		this.paletteElement?.classList.remove('active');
	}

	paletteShown() {
		return this.paletteElement?.classList.contains('active');
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
		if (nextItem) {
			this.selectedItem = nextItem;
			this.setSelectedElement();
		}
	}

	moveUp() {
		const prevItem = this.selectedItem.previousElementSibling;
		if (prevItem) {
			this.selectedItem = prevItem;
			this.setSelectedElement();
		}
	}

	doAction() {
		this.hidePalette();
		this.selectedItem.querySelector('a').click();
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

		if (!this.selectedItemDisplayed()) {
			this.selectedItem = this.paletteItems[0];
		}

		this.setSelectedElement();
	}

}
