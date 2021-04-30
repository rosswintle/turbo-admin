class TurboAdmin {

    constructor() {

        console.log('Initialising TurboAdmin');

        this.paletteElement = document.getElementById('ta-command-palette-container');
        this.paletteInputElement = document.getElementById('ta-command-palette-input');
        this.paletteItemsElement = document.getElementById('ta-command-palette-items');

        this.paletteItems = [];
        this.paletteFuseOptions = [];
        this.paletteFuse = null;

        if (typeof (Fuse) !== 'function') {
            return;
        }

        this.paletteItems = this.getPaletteItems();
        this.selectedItem = this.paletteItems[0];
        this.setSelectedElement();

        this.paletteFuseOptions = {
            keys: ['innerText'],
        }

        this.paletteFuse = new Fuse(this.paletteItems, this.paletteFuseOptions);

        document.addEventListener('keydown', e => this.handleGlobalKey(e));

        this.paletteInputElement.addEventListener('keyup', e => {
            this.paletteActions(e);
        });
    }

    handleGlobalKey(e) {
        console.log(e.code);
        if (e.code === 'KeyP' && this.metaKeysPressed(e)) {
            this.showPalette();
        }
        if (e.code === 'Escape' && this.paletteShown()) {
            this.hidePalette();
        }
    }

    paletteActions(e) {
        if (e.code === 'ArrowDown' && this.paletteShown()) {
            this.moveDown();
            return;
        }
        if (e.code === 'ArrowUp' && this.paletteShown()) {
            this.moveUp();
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

    setSelectedElement() {
        this.paletteItemsElement?.querySelectorAll('li.selected')?.forEach(e => e.classList.remove('selected'));

        this.selectedItem.classList.add('selected');

        this.scrollList();
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
        this.selectedItem.querySelector('a').click();
    }

    getPaletteItems() {
        return this.paletteItemsElement?.querySelectorAll('li');
    }

    selectedItemDisplayed() {
        return Array.from(turboAdmin.paletteItemsElement.childNodes).includes(turboAdmin.selectedItem);
    }

    paletteSearchAndUpdate() {
        this.updatePaletteItems(this.paletteSearch());
    }

    paletteSearch() {
        if (this.paletteInputElement.value === '') {
            return this.paletteItems;
        }
        return this.paletteFuse.search(this.paletteInputElement.value).map(i => i.item);
    }

    updatePaletteItems(items) {
        const newItems = document.createElement('ul');
        newItems.id = 'ta-command-palette-items';

        items.forEach(i => {
            newItems.appendChild(i);
        })

        this.paletteItemsElement.replaceChildren(...newItems.children);

        if (!this.selectedItemDisplayed()) {
            this.selectedItem = this.getPaletteItems()[0];
        }

        this.setSelectedElement();
    }

}

document.addEventListener('turbo-admin-ready', e => { turboAdmin = new TurboAdmin(); });
