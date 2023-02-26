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

        this.selectorsToHide = [
            '#wp-admin-bar-root-default > li',
            '.monsterinsights-adminbar-menu-item',
        ];

        this.barkeeperState = this.getBarkeeperState();

        this.root = document.getElementById('wp-admin-bar-root-default');
        if (! this.root) {
            return;
        }
        this.itemsToHide = document.querySelectorAll( this.selectorsToHide.join(', ') );

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

            this.setBarkeeperState(this.barkeeperState);
        });

        this.root.insertAdjacentElement('afterend', this.button);

        this.setupObserver();
    }

    /**
     * Some awkward plugins add themselves into the bar using JS
     */
    setupObserver() {
        this.observer = new MutationObserver( mutations => {
            mutations.forEach( mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach( node => {
                        if (node.classList && node.classList.contains('ta-barkeeper-collapsable')) {
                            return;
                        }
                        if (node.id && this.exclusionIds.includes(node.id)) {
                            return;
                        }
                        // Check is the node matches any of the selectors
                        if (node.matches(this.selectorsToHide.join(', '))) {
                            node.classList.add('ta-barkeeper-collapsable');
                            return;
                        }
                    });
                }
            });
        });

        this.observer.observe(this.root, {
            childList: true,
            subtree: true,
        });
    }

    getBarkeeperState() {
        if (window.turboAdminIsExtension()) {
            return globalThis.turboAdmin.options['barkeeper-state'];
        } else {
            return window.localStorage.getItem('turbo-admin-barkeeper-state');
        }
    }

    setBarkeeperState(state) {
        if (window.turboAdminIsExtension()) {
            chrome.runtime.sendMessage({
                'action': 'barkeeperSetState',
                'barkeeperState': this.barkeeperState,
            });
        } else {
            window.localStorage.setItem('turbo-admin-barkeeper-state', state);
        }
    }
}
