import TurboAdmin from './class-turbo-admin.js';
import TurboAdminMenuItem from './class-turbo-admin-menu-item.js';

class Main {

	constructor() {
		if (document.getElementById('ta-command-palette-container')) {
			console.log('TurboAdmin already initialised - I won\'t make a second copy!');
			return;
		}
		this.menu = this.getMenu();
		this.addPalette();
		this.turboAdmin = new TurboAdmin(this.menu);
	}

	getMenu() {
		const items = [];
		const menuTop = document.getElementById('adminmenu');
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
		return items;
	}

	addPalette() {
		const container = document.createElement('div');
		container.id = 'ta-command-palette-container';
		const palette = document.createElement('div');
		palette.id = 'ta-command-palette';
		const input = document.createElement('input');
		input.id = "ta-command-palette-input";
		input.name = "ta-command-palette-input";
		input.type = "text";
		const list = document.createElement('ul');
		list.id = "ta-command-palette-items";
		container.appendChild(palette);
		palette.appendChild(input);
		palette.appendChild(list);

		// this.menu.forEach(e => {
		// 	const li = document.createElement('li');
		// 	const a = document.createElement('a');
		// 	li.appendChild(a);
		// 	a.href = e.action;
		// 	let title = e.title;
		// 	if (e.parentTitle !== '') {
		// 		title = e.parentTitle + ": " + title;
		// 	}
		// 	a.innerHTML = title;
		// 	list.appendChild(li);
		// });

		const wpWrap = document.getElementById('wpwrap');
		wpWrap.appendChild(container);
	}

}

// Note that in the extension, the globalThis is not the browser's global scope,
// it is sandboxed. So we can't check across the plugin/extension boundary here.
globalThis.turboAdmin = null;
document.addEventListener('DOMContentLoaded', e => { turboAdmin = new Main() });
