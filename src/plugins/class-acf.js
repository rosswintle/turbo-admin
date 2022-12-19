export default class Acf {

    constructor() {

    }

    /**
     * Returns true if the code detects that ACF is installed
     * (only works back-end).
     *
     * @returns {boolean}
     */
    isAcfInstalled() {
        return null !== document.getElementById('toplevel_page_edit-post_type-acf-field-group')
    }

    /**
     * Returns the URL of the ACF screen in the backend.
     * (TODO: Store this somewhere?)
     *
     * @returns {string}
     */
    acfScreenUrl() {
        const elem = /** @type {HTMLAnchorElement} */(document.getElementById('toplevel_page_edit-post_type-acf-field-group')?.querySelector('a.menu-top'));
        return elem?.href;
    }

    /**
     * Gets the field groups from the ACF screen
     * Returns a promise that resolves to an array of objects like:
     * {
     *   label: <label>
     *   link: <url>
     * }
     *
     * @returns {Promise}
     */
    async getFieldGroups() {
        const response = await fetch(
            this.acfScreenUrl(),
            {
                "headers": {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                },
                "method": "GET",
                "credentials": 'include',
                "cache": "no-cache",
                "mode": "cors"
            }
        )
        const text = await response.text()
        const dom = document.createRange().createContextualFragment(text)
        const items = /** @type {NodeListOf<HTMLAnchorElement>} */(
            dom.querySelectorAll('tr.type-acf-field-group a.row-title')
        )
        return Array.from(items).map(
            item => {
                return { label: item.innerText, link: item.href }
            },
            items
        )
    }

}
