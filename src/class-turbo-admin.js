import TurboAdminPalette from './class-turbo-admin-palette.js';
import TurboAdminMenuItem from './class-turbo-admin-menu-item.js';

export default class TurboAdmin {

	constructor(options) {
		if (document.getElementById('ta-command-palette-container')) {
			console.log('TurboAdmin already initialised - I won\'t make a second copy!');
			return;
		}

		this.options = options;

		// Figure out the siteurl and home - this is different on the front and back end
		if (this.isBackend()) {
			this.siteUrl = window.location.href.match(/(^.*wp-admin)/)[1];
			this.home = document.getElementById('wp-admin-bar-site-name').querySelector('a').href;
		} else {
			this.siteUrl = document.getElementById('wp-admin-bar-dashboard').querySelector('a').href;
			this.home = null; // Don't know how to detect this.
		}

		this.menu = this.getMenu();
		this.addAdditionalMenuItems();
		this.addPalette();
		this.turboAdminPalette = new TurboAdminPalette(this.menu, this.options);
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

	isBackend() {
		return document.body.classList.contains('wp-admin');
	}

	addAdditionalMenuItems() {
		// This can't always be detected
		if (this.home) {
			this.menu.push(
				new TurboAdminMenuItem('View/visit site', this.home, '')
			);
		}
		if (this.siteUrl && ! this.isBackend()) {
			this.menu.push(
				new TurboAdminMenuItem('Dashboard / Admin', this.siteUrl, '')
			);
		}
		const logoutUrl = document.getElementById('wp-admin-bar-logout').querySelector('a').href;
		this.menu.push(
			new TurboAdminMenuItem('Logout', logoutUrl, '')
		);
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

		const wpAdminBar = document.getElementById('wpadminbar');
		wpAdminBar.insertAdjacentElement('afterend', container);
	}

}
