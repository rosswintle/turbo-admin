import TurboAdminPlugin from '../types/class-turbo-admin-plugin.js';

export default class TurboAdminBarkeeper extends TurboAdminPlugin {
    constructor() {
        super('Barkeeper');
    }

    /**
     * Should the plugin activate
     *
     * @returns {boolean}
     */
    shouldActivate() {
        if (true !== globalThis.turboAdmin.options['barkeeper']) {
            return false;
        }
        // Bail if we aren't in the admin
        if (! document.getElementById('wpadminbar')) {
            return false;
        }
        // Bail if we don't have the left-hand admin bar (some users only have right-hand side)
        if (! document.getElementById('wp-admin-bar-root-default')) {
            return false;
        }
        return true;
    }

    /**
     * Activate and initialise the plugin
     */
    activate() {
        super.activate();

        this.exclusionIds = [
            'wp-admin-bar-menu-toggle',
            'wp-admin-bar-wp-logo',
            'wp-admin-bar-site-name',
            'wp-admin-bar-updates',
        ];

        this.barkeeperState = globalThis.turboAdmin.options['barkeeper-state'];

        this.root = document.getElementById('wp-admin-bar-root-default');
        if (! this.root) {
            return;
        }
        this.itemsToHide = document.querySelectorAll( '#wp-admin-bar-root-default > li');

        Array.from(this.itemsToHide).forEach( element => {
            if (this.exclusionIds.includes(element.id)) {
                return;
            }
            element.classList.add('ta-barkeeper-collapsable');
        });

        if (this.barkeeperState === 'closed') {
            this.root.classList.toggle('ta-barkeeper-closed');
        }

        // Add toggle
        this.button = document.createElement('button');
        this.button.id = 'ta-barkeeper-toggle';
        this.button.innerText = '<';

        this.button.addEventListener('click', e => {
            this.root.classList.toggle('ta-barkeeper-closed');

            this.barkeeperState = this.barkeeperState === 'open' ? 'closed' : 'open';

            chrome.runtime.sendMessage({
                'action': 'barkeeperSetState',
                'barkeeperState': this.barkeeperState,
            });
        });

        this.root.insertAdjacentElement('afterend', this.button);
    }

}
