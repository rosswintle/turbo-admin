export default class ListTableShortcuts {

    constructor() {
        /**
         * @type {ListTableShortcuts}
         */
        const me = this;

        /**
         * @type {null|HTMLElement}
         */
        this.currentRow = null;

        /**
         * @type {number}
         */
        this.currentRowIndex = 0;

        /**
         * @type {boolean}
         */
        this.actionsOpen = false;

        /**
         * @type {HTMLTableElement}
         */
        this.listTable = document.querySelector('.wp-list-table');

        /**
         * @type {boolean}
         */
        this.isWooCommerce = false;

        if (!this.listTable) {
            return;
        }

        // We make some VERY special exceptions for WooCommerce
        if (document.body.classList.contains('woocommerce-admin-page') &&
            document.body.classList.contains('post-type-shop_order')) {
            this.isWooCommerce = true;
        }

        /**
         * @type {Boolean}
         */
        this.isMac = globalThis.turboAdmin.turboAdminPalette.isMac();

        /**
         * @type {NodeListOf<HTMLTableRowElement>}
         */
        this.tableRows = this.listTable.querySelectorAll('tbody#the-list > tr');

        // Grr... comments list is different! WHY?!
        if (document.body.classList.contains('edit-comments-php')) {
            this.tableRows = this.listTable.querySelectorAll('tbody#the-comment-list > tr');
        }

        document.addEventListener('keydown', e => this.handleKey(e));

        // Chrome handles escape key on search input elements, so we need to
        // intercept it here.
        const searchInput = document.querySelector('.search-box input[type="search"]');
        searchInput.addEventListener('keyup', e => this.handleSearchInputKey(e));
    }

    /**
     *
     * @param {KeyboardEvent} ev
     */
    handleKey(ev) {
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }

        if (globalThis.turboAdmin.turboAdminPalette.isPaletteOpen()) {
            return;
        }

        if (ev.key === 'j') {
            if (this.actionsOpen) {
                this.actionMoveDown();
            } else {
                this.tableMoveDown();
            }
        } else if (ev.key === 'k') {
            if (this.actionsOpen) {
                this.actionMoveUp();
            } else {
                this.tableMoveUp();
            }
        } else if (ev.key.toLowerCase() === 'enter' && this.currentRow !== null) {
            if (this.actionsOpen) {
                this.openCurrentRowAction(ev);
            } else {
                this.openTableRowActions(ev);
            }
        } else if (ev.key === '/') {
            this.focusSearch(ev);
        } else if (ev.key === 'f' && ev.ctrlKey) {
            this.nextPage(ev);
        } else if (ev.key === 'b' && ev.ctrlKey) {
            this.prevPage(ev);
        } else if (ev.key === 'ArrowDown') {
            if (this.actionsOpen) {
                this.actionMoveDown(ev);
            }
        } else if (ev.key === 'ArrowUp') {
            if (this.actionsOpen) {
                this.actionMoveUp(ev);
            }
        } else if (ev.key.toLowerCase() === 'escape') {
            if (this.actionsOpen) {
                this.closeTableRowActions(ev);
            }
            // If the search box is focussed... looks like WP intercepts this! :-(
            if (document.getElementById('post-search-input') === document.activeElement) {
                document.getElementById('post-search-input').blur();
            }
        }

    }

    handleSearchInputKey(ev) {
        if (ev.key.toLowerCase() === 'escape') {
            ev.target.blur();
        }
    }

    tableMoveDown() {
        this.preTableChange();

        // Move down
        if (this.currentRow === null) {
            this.currentRowIndex = 0;
        } else if (this.currentRowIndex < this.tableRows.length - 1) {
            this.currentRowIndex++;
        }
        this.updateTable();
    }

    tableMoveUp() {
        this.preTableChange();

        if (this.currentRowIndex > 0) {
            this.currentRowIndex--;
        }

        this.updateTable();
    }

    preTableChange() {
        if (this.currentRow !== null) {
            this.tableRows[this.currentRowIndex].classList.remove('ta-active-table-row');
        }
    }

    updateTable() {
        this.currentRow = this.tableRows[this.currentRowIndex];

        if (!this.tableRows[this.currentRowIndex].classList.contains('ta-active-table-row')) {
            this.tableRows[this.currentRowIndex].classList.add('ta-active-table-row');
        }
    }

    openTableRowActions(ev) {
        turboAdminLog(this);

        // WooCommerce doesn't have row actions, so we just find the link and visit it
        if (this.isWooCommerce) {
            this.currentRow.querySelector('a.order-view').click();
            return;
        }

        this.actionsOpen = true;

        const rowActions = this.currentRow.querySelector('.row-actions');

        if (rowActions) {
            rowActions.classList.add('visible');
        }

        const titleElem = this.currentRow.querySelector('strong');
        const titleLink = titleElem.querySelector('a');

        if (titleLink) {
            titleLink.classList.add('ta-active-table-row-link');
            return;
        }

        const rowActionLinks = rowActions.querySelectorAll('span a, span button');

        if (rowActionLinks) {
            rowActionLinks[0].classList.add('ta-active-table-row-link');
        }
    }

    closeTableRowActions(ev) {
        turboAdminLog(this);
        const rowActions = this.currentRow.querySelector('.row-actions');

        // Don't do this on plugins screen!
        if (!document.body.classList.contains('plugins-php')) {
            if (rowActions) {
                rowActions.classList.remove('visible');
            }
        }

        const activeLink = document.querySelector('.ta-active-table-row-link');
        if (activeLink) {
            activeLink.classList.remove('ta-active-table-row-link');
        }

        this.actionsOpen = false;
    }

    actionMoveDown(ev) {
        /** @type {HTMLElement} */
        const currentLink = document.querySelector('.ta-active-table-row-link');

        // Handle the case where the title link is selected
        if (currentLink.closest('strong')) {
            const rowActions = this.currentRow.querySelectorAll('.row-actions span a, .row-actions span button');
            if (rowActions) {
                rowActions[0].classList.add('ta-active-table-row-link');
                currentLink.classList.remove('ta-active-table-row-link');
            }
            return;
        }

        /** @type {HTMLElement} */
        const nextLink = currentLink.parentElement?.nextElementSibling?.querySelector('a, button');
        if (nextLink) {
            nextLink.classList.add('ta-active-table-row-link');
            currentLink.classList.remove('ta-active-table-row-link');
        }
    }

    actionMoveUp(ev) {
        /** @type {HTMLElement} */
        const currentLink = document.querySelector('.ta-active-table-row-link');

        // Handle the case where the title link is selected
        if (currentLink.closest('strong')) {
            return;
        }

        /** @type {HTMLElement} */
        const prevLink = currentLink.parentElement?.previousElementSibling?.querySelector('a, button');

        // Handle the case where the first item is selected and we need to go back to the title
        if (!prevLink) {
            const titleLink = this.currentRow.querySelector('strong a');
            if (titleLink) {
                titleLink.classList.add('ta-active-table-row-link');
                currentLink.classList.remove('ta-active-table-row-link');
            }
            return;
        }

        prevLink.classList.add('ta-active-table-row-link');
        currentLink.classList.remove('ta-active-table-row-link');
    }

    openCurrentRowAction(ev) {
        // TODO: Open the current row action
        /** @type {HTMLElement} */
        const currentLink = document.querySelector('.ta-active-table-row-link');
        if (currentLink) {
            currentLink.click();
        }
    }

    focusSearch(ev) {
        /** @type {HTMLInputElement} */
        const searchInput = document.querySelector('.search-box input[type="search"]');
        if (searchInput) {
            searchInput.focus();
            ev.preventDefault();
        }
    }

    nextPage(ev) {
        /** @type {HTMLAnchorElement} */
        const nextPageLink = document.querySelector('.tablenav-pages .next-page');
        if (nextPageLink) {
            nextPageLink.click();
            ev.preventDefault();
        }
    }

    prevPage(ev) {
        /** @type {HTMLAnchorElement} */
        const prevPageLink = document.querySelector('.tablenav-pages .prev-page');
        if (prevPageLink) {
            prevPageLink.click();
            ev.preventDefault();
        }
    }
}
