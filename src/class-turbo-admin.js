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
			// If we're not in the backend then (in the extension at least) we
			// could be on the front-end and not logged in, so check for an
			// admin bar and bail if there isn't one.
			//            if (! document.getElementById('wpadminbar')) {
			//                return;
			//            }

			if (document.getElementById('wpadminbar')) {
				this.siteUrl = document.getElementById('wp-admin-bar-dashboard').querySelector('a').href;
				this.home = null; // Don't know how to detect this.
			}
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

		let extraItems = [
			{
				'detectType': 'dom',
				'detectSelector': 'body.wp-admin #wp-admin-bar-site-name-default a',
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
				'itemUrlFunction': () => document.getElementById('wp-admin-bar-logout').querySelector('a').href
			},
			{
				'detectType': 'dom',
				'detectSelector': '#wp-admin-bar-edit a',
				'itemTitleFunction': (item) => item.textContent,
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
				'itemUrlFunction': () => document.querySelector('link[rel="https://api.w.org/"]')?.href.replace('wp-json/', 'wp-admin/')
			},
			// This is on the login screen
			{
				'detectType': 'dom',
				'detectSelector': '#backtoblog a',
				'itemTitleFunction': () => "View/visit site",
				'itemUrlFunction': (element) => element.href
			}
		];

		extraItems.forEach(item => {
			let detected = false;
			let element = null;
			if (item.detectType === 'url') {
				detected = Boolean(window.location.href.includes(item.detectPattern));
			} else if (item.detectType === 'dom') {
				if (item.detectSelector) {
					element = document.querySelector(item.detectSelector);
					detected = Boolean(element);
				} else if (item.detectSelectorNone) {
					element = document.querySelector(item.detectSelectorNone);
					detected = !Boolean(element);
				}
			}
			if (!detected) {
				return;
			}
			this.menu.push(
				new TurboAdminMenuItem(item.itemTitleFunction(element), item.itemUrlFunction(element), '')
			);
		})
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

		document.body.appendChild(container);
	}

}
