export default class TurboAdminBarkeeper {

    constructor(barkeeperState) {
        // Bail if we aren't in the admin
        if (! document.getElementById('wpadminbar')) {
            return;
        }

        this.exclusionIds = [
            'wp-admin-bar-menu-toggle',
            'wp-admin-bar-wp-logo',
            'wp-admin-bar-site-name',
            'wp-admin-bar-updates',
        ];

        this.barkeeperState = barkeeperState;

        this.root = document.getElementById('wp-admin-bar-root-default');
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

            if ('object' === typeof(browser)) {
                browser.runtime.sendMessage({
                    'action': 'barkeeperSetState',
                    'barkeeperState': this.barkeeperState,
                });
            } else {
                window.localStorage.setItem('turboAdminBarkeeperState', this.barkeeperState);
            }
        });

        this.root.insertAdjacentElement('afterend', this.button);
    }

}
