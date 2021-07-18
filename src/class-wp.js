export default class Wp {

    constructor() {

        // Set home and siteUrl
        this.siteUrl = '';
        this.home = '';
        this.loginUrl = '';
        this.apiLinkUrl = '';

        this.getUrls();

        // Fetch previously loaded site URL
        this.previousUrl = window.localStorage.getItem('ta-palette-data-site');

        /**
         * Tells you if the best-guess site URL of the current page is different
         * to that of the previously saved site URL.
         */
        this.siteChanged = this.home !== this.previousUrl;

        /**
         * Are we in the back-end?
         */
        this.isBackend = this.isBackend();

        // Save current site URL for next time
        window.localStorage.setItem('ta-palette-data-site', this.home);
    }

    isBackend() {
        return document.body.classList.contains('wp-admin');
    }

    getUrls() {
        const apiLink = document.querySelector('link[rel="https://api.w.org/"]');
        if (apiLink) {
            this.apiLinkUrl = apiLink.href;
        }
        // Figure out the siteurl and home - this is different on the front and back end
        if (this.isBackend()) {
            this.siteUrl = window.location.href.match(/(^.*wp-admin)/)[1];
            this.home = document.getElementById('wp-admin-bar-site-name').querySelector('a').href;
        } else {
            // If we're not in the backend then (in the extension at least) we
            // could be on the front-end and not logged in, so check for an
            // admin bar and grab from that if there is one.
            if (document.getElementById('wpadminbar')) {
                this.siteUrl = document.getElementById('wp-admin-bar-dashboard').querySelector('a').href;
                // Try for the API link
                if (this.apiLinkUrl) {
                    if (this.apiLinkUrl.includes('/wp-json')) {
                        this.home = this.apiLinkUrl.replace('wp-json/', '');
                    }
                    if (this.apiLinkUrl.includes('index.php?rest_route')) {
                        this.home = this.apiLinkUrl.replace(/index.php\?rest_route.*/, '');
                    }
                } else {
                    // Guess from the siteUrl
                    this.home = this.siteUrl.replace(/wp-admin\/?/, '');
                }

            } else {
                // Try for the API link
                if (this.apiLinkUrl) {
                    if (this.apiLinkUrl.includes('/wp-json')) {
                        this.home = this.apiLinkUrl.replace('wp-json/', '');
                    }
                    if (this.apiLinkUrl.includes('index.php?rest_route')) {
                        this.home = this.apiLinkUrl.replace(/index.php\?rest_route.*/, '');
                    }
                    this.siteUrl = this.home + 'wp-admin/';
                }
            }
        }

        // Always trim the / for comparisons
        this.siteUrl = this.siteUrl.replace(/(.+)\/$/, '$1');
        this.home = this.home.replace(/(.+)\/$/, '$1');

        // console.log('siteUrl: ', this.siteUrl);
        // console.log('home: ', this.home);
    }

}
