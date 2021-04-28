class TurboAdminMenuItem {

	constructor(title, action, parentTitle) {
		this.title = title;
		this.action = action;
		this.parentTitle = parentTitle;
	}
}

class TurboAdminList {

	constructor() {
		console.log('It lives!');
		this.menu = this.getMenu();
		this.addPalette();
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

		this.menu.forEach(e => {
			const li = document.createElement('li');
			const a = document.createElement('a');
			li.appendChild(a);
			a.href = e.action;
			let title = e.title;
			if (e.parentTitle !== '') {
				title = e.parentTitle + ": " + title;
			}
			a.innerHTML = title;
			list.appendChild(li);
		});

		const wpWrap = document.getElementById('wpwrap');
		wpWrap.appendChild(container);

		// Create ready event
		var event = new CustomEvent("turbo-admin-ready");

		// Dispatch/Trigger/Fire the event
		document.dispatchEvent(event);
	}

}

document.addEventListener('DOMContentLoaded', e => { turboAdminList = new TurboAdminList() });
