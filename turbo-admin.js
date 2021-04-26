const paletteElement = document.getElementById('ta-command-palette-container');
const paletteInputElement = document.getElementById('ta-command-palette-input');
const paletteItemsElement = document.getElementById('ta-command-palette-items');

let paletteItems = [];
let paletteFuseOptions = [];
let paletteFuse = null;

function initPalette() {
	if (typeof (Fuse) !== 'function') {
		return;
	}

	paletteItems = getPaletteItems();

	paletteFuseOptions = {
		keys: ['innerText'],
	}

	paletteFuse = new Fuse(paletteItems, paletteFuseOptions);

	document.addEventListener('keydown', e => {
		console.log(e.code);
		if (e.code === 'KeyP' && metaKeysPressed(e)) {
			console.log('KeyP pressed');
			showPalette();
		}
		if (e.code === 'Escape' && paletteShown()) {
			hidePalette();
		}
	});

	paletteInputElement.addEventListener('keyup', e => {
		paletteSearchAndUpdate();
	});
}

function metaKeysPressed(e) {
	return (e.metaKey && e.shiftKey && e.altKey);
}

function showPalette() {
	paletteInputElement.value='';
	paletteElement?.classList.add('active');
	paletteInputElement?.focus();
}

function hidePalette() {
	paletteElement?.classList.remove('active');
}

function paletteShown() {
	return paletteElement?.classList.contains('active');
}

function getPaletteItems() {
	return paletteItemsElement?.querySelectorAll('li');
}

function paletteSearchAndUpdate() {
	updatePaletteItems(paletteSearch());
}

function paletteSearch() {
	if (paletteInputElement.value === '') {
		return paletteItems;
	}
	console.log(paletteInputElement.value);
	return paletteFuse.search(paletteInputElement.value).map(i => i.item);
}

function updatePaletteItems(items) {
	const newItems = document.createElement('ul');
	newItems.id = 'ta-command-palette-items';

	items.forEach(i => {
		newItems.appendChild(i);
	})

	paletteItemsElement.replaceChildren(...newItems.children);
}

initPalette();
