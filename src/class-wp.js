export default class Wp {

    constructor() {

        // Set home and siteUrl
        this.siteUrl = '';
        this.home = '';
        this.loginUrl = '';
        this.apiLinkUrl = '';
    }

    async completeInit() {
        // Fetch previously loaded site URL
        this.previousUrl = window.localStorage.getItem('ta-palette-data-site');

        // Fetch previously-stored siteUrl and home
        this.siteUrl = window.localStorage.getItem('ta-palette-data-siteurl');
        this.home = window.localStorage.getItem('ta-palette-data-home');

        /**
         * Are we in the back-end?
         */
        this.isBackend = this.getIsBackend();

        /**
         * Figure out all the WP URLs
         */
        await this.getUrls();

        /**
         * Tells you if the best-guess site URL of the current page is different
         * to that of the previously saved site URL.
         */
        this.siteChanged = this.home !== this.previousUrl;

        // Save current site URL for next time
        window.localStorage.setItem('ta-palette-data-site', this.home);
    }

    getIsBackend() {
        return document.body.classList.contains('wp-admin');
    }

    /**
     * Return the URL with a trailing slash if it didn't already have one.
     *
     * @param {String} url The URL to check
     * @return {String}    The resulting URL
     */
    ensureTrailingSlash( url ) {
        if (url.endsWith('/')) {
            return url;
        } else {
            return url + '/';
        }
    }

    /**
     * Tests if a URL works and, if redirected, that the final URL contains a given
     * string. Returns the final, redirected-to URL if the test passed, or false
     * otherwise.
     *
     * @param {String} url                    The URL to test.
     * @param {String} responseUrlMustContain The string to test against the final URL
     * @returns {Promise<String|Boolean>}   The final URL or false.
     */
    async testUrl(url, responseUrlMustContain='') {

        /** @type {RequestInit} */
        const init = {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin'
        }

        const response = await fetch(url, init);

        if (response.redirected && !response.url.includes(responseUrlMustContain)) {
            return false;
        }

        if ( ! response.ok ) {
            return false;
        }

        return response.url;
    }

    async findWhichUrlWorks(urls, responseUrlMustContain='') {
        let workingUrl = false;
        let result;
        // This has to be a for loop rather than reduce or forEach as separate
        // async callbacks would be launched asynchronously.
        for (let i=0; i<urls.length; i++) {
            if (workingUrl) continue;
            result = await this.testUrl(urls[i], responseUrlMustContain);
            if (result !== false) {
                workingUrl = result;
            }
        }
        return workingUrl;
    }

    /**
     *
     * @param {String} homeUrl
     */
    async guessSiteUrlFromHome( homeUrl ) {
        const homeWithSlash = this.ensureTrailingSlash(homeUrl);

        // NOTE: Backed out of this until I can make it work async.
        // Might not even be a good idea anyway.

        // const possibleUrls = [
        //     homeWithSlash + 'wp-admin/',
        //     homeWithSlash + 'wp/wp-admin'
        // ];
        // return this.findWhichUrlWorks(possibleUrls, 'wp-admin');
        return homeWithSlash + 'wp-admin/';
    }

    /**
     *
     * @param {String} homeUrl
     */
    async guessHome() {
        const currentUrl = new URL(window.location);
        const origin = this.ensureTrailingSlash(currentUrl.origin);

        // NOTE: Backed out of this until I can make it work async.
        // Might not even be a good idea anyway.

        // const possibleUrls = [
        //     origin
        // ];
        // return this.findWhichUrlWorks(possibleUrls, 'wp-admin');
        return origin;
    }

    /**
     *
     * @param {String} siteUrl
     * @returns {String}
     */
    guessHomeFromSiteUrl(siteUrl) {
        // Not much we can do here.
        return siteUrl.replace(/wp-admin\/?/, '');
    }

    async getUrls() {
        // See if we can actually find the URL for the API
        /** @type {HTMLLinkElement|null} */
        const apiLink = document.querySelector('link[rel="https://api.w.org/"]');

        if (apiLink) {
            this.apiLinkUrl = apiLink.href;
        }
        // Figure out the siteurl and home - this is different on the front and back end
        if (this.isBackend) {
            // This is easy in the back end/Dashboard!
            this.siteUrl = window.location.href.match(/(^.*wp-admin)/)[1];
            this.home = document.getElementById('wp-admin-bar-site-name').querySelector('a').href;

            // Always set the siteUrl and home as this is definitive
            window.localStorage.setItem('ta-palette-data-siteurl', this.siteUrl);
            window.localStorage.setItem('ta-palette-data-home', this.home);
        } else if (! this.siteUrl || ! this.home) {
            let urlsFound = false;

            // If we're not in the backend then (in the extension at least) we
            // could be on the front-end and not logged in, so check for an
            // admin bar and grab from that if there is one.
            if (document.getElementById('wpadminbar')) {
                const dashboardLink = document.getElementById('wp-admin-bar-dashboard')?.querySelector('a');
                if (dashboardLink) {
                    this.siteUrl = dashboardLink.href;
                }
                // Try for the API link
                if (this.apiLinkUrl) {
                    if (this.apiLinkUrl.includes('/wp-json')) {
                        this.home = this.apiLinkUrl.replace('wp-json/', '');
                    }
                    if (this.apiLinkUrl.includes('index.php?rest_route')) {
                        this.home = this.apiLinkUrl.replace(/index.php\?rest_route.*/, '');
                    }
                    urlsFound = true;
                } else {
                    // We might know what the siteUrl is, so guess the home from the siteUrl
                    if (this.siteUrl) {
                        this.home = this.guessHomeFromSiteUrl(this.siteUrl);
                        urlsFound = true;
                    }
                }
            }
            if (! urlsFound) {
                // Try for the API link
                // TODO: This needs to be async so it doesn't hold things up.
                if (this.apiLinkUrl) {
                    if (this.apiLinkUrl.includes('/wp-json')) {
                        this.home = this.apiLinkUrl.replace('wp-json/', '');
                    }
                    if (this.apiLinkUrl.includes('index.php?rest_route')) {
                        this.home = this.apiLinkUrl.replace(/index.php\?rest_route.*/, '');
                    }
                    // We (probably) know what the home link is now, so guess the wp-admin
                    if (this.home) {
                        this.siteUrl = await this.guessSiteUrlFromHome( this.home );
                    } else {
                        this.siteUrl = this.guessSiteUrl();
                    }
                    urlsFound = true;
                }
            }
            if (! urlsFound) {
                // We got nothing.
                this.home    = await this.guessHome();
                if (this.home) {
                    this.siteUrl = await this.guessSiteUrlFromHome(this.home);
                }
            }
        }

        // Always trim the / for comparisons
        if (this.siteUrl) {
            this.siteUrl = this.siteUrl.replace(/(.+)\/$/, '$1');
        }
        if (this.home) {
            this.home = this.home.replace(/(.+)\/$/, '$1');
        }

        // turboAdminLog('siteUrl: ', this.siteUrl);
        // turboAdminLog('home: ', this.home);
    }

}
