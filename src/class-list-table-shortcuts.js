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

        /**
         * @type {boolean}
         */
        this.isPluginInstall = false;

        if (!this.listTable) {
            return;
        }

        // We make some VERY special exceptions for WooCommerce
        if (document.body.classList.contains('woocommerce-admin-page') &&
            document.body.classList.contains('post-type-shop_order')) {
            this.isWooCommerce = true;
        }

        // And for the add plugins screen
        if (document.body.classList.contains('plugin-install-php')) {
            this.isPluginInstall = true;
        }

        /**
         * @type {Boolean}
         */
        this.isMac = globalThis.turboAdmin.turboAdminPalette.isMac();

        /**
         * @type {NodeListOf<HTMLTableRowElement>}
         */
        this.tableRows = this.listTable.querySelectorAll('tbody#the-list > tr');

        // Plugin install is different.
        if (this.isPluginInstall) {
            this.tableRows = this.listTable.querySelectorAll('#the-list .plugin-card');
        }

        // Grr... comments list is different! WHY?!
        if (document.body.classList.contains('edit-comments-php')) {
            this.tableRows = this.listTable.querySelectorAll('tbody#the-comment-list > tr');
        }

        document.addEventListener('keydown', e => this.handleKey(e));

        // Chrome handles escape key on search input elements, so we need to
        // intercept it here.
        const searchInput = document.querySelector(
            '.search-box input[type="search"], .search-form input[type="search"]'
        );

        if (searchInput) {
            searchInput.addEventListener('keyup', e => this.handleSearchInputKey(e));
        }
    }

    /**
     *
     * @param {KeyboardEvent} ev
     */
    handleKey(ev) {
        const isActiveElementBody = document.activeElement.tagName === 'BODY';
        const isActiveElementInListTable = this.listTable && this.listTable.contains(document.activeElement);
        const isSearchFocussed = this.getSearchInputElement() === document.activeElement;
        if ((!isActiveElementBody && !isActiveElementInListTable) || isSearchFocussed) {
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
                ev.preventDefault();
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
        } else if (ev.key.toLowerCase() === 'escape' /* && !document.body.classList.contains('modal-open')*/) {
            if (this.actionsOpen) {
                this.closeTableRowActions(ev);
            }
            // If the search box is focussed... Note that Chrome does its own thing with escape here.
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

    getSearchInputElement() {
        return document.querySelector('.search-box input[type="search"], .search-form input[type="search"]');
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

        this.scrollIntoViewIfNeeded(this.currentRow);
    }

    /**
     * Scrolls the element into view if it is not already.
     */
    scrollIntoViewIfNeeded(element) {
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top;
        const elementBottom = elementRect.bottom;
        const viewportTop = 0;
        const viewportBottom = window.innerHeight;
        if (elementBottom > viewportBottom) {
            element.scrollIntoView({ behavior: "smooth", block: "end" });
        } else if (elementTop < viewportTop) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /**
     * Gets the list table row actions container for the current row
     */
    getRowActionsContainer() {
        let container = this.currentRow.querySelector('.row-actions');

        if (this.isPluginInstall) {
            container = this.currentRow.querySelector('.plugin-action-buttons');
        }

        return container;
    }

    /**
     * Gets list table row actions for the current row
     */
    getRowActions() {
        let rowActions = this.currentRow.querySelectorAll('.row-actions span a, .row-actions span button');

        if (this.isPluginInstall) {
            rowActions = this.currentRow.querySelectorAll('.plugin-action-buttons a');
        }

        return rowActions;
    }

    openTableRowActions(ev) {
        turboAdminLog(this);

        // WooCommerce doesn't have row actions, so we just find the link and visit it
        if (this.isWooCommerce) {
            this.currentRow.querySelector('a.order-view').click();
            return;
        }

        this.actionsOpen = true;

        let rowActions = this.getRowActionsContainer();

        if (rowActions) {
            rowActions.classList.add('visible');
        }

        const titleElem = this.currentRow.querySelector('strong');
        const titleLink = titleElem.querySelector('a');

        if (titleLink) {
            titleLink.classList.add('ta-active-table-row-link');
            return;
        }

        let rowActionLinks = this.getRowActions();

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
            const rowActions = this.getRowActions();
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
        // Don't do this for plugin install screen
        if (currentLink) {
            currentLink.click();
        }
    }

    focusSearch(ev) {
        /** @type {HTMLInputElement} */
        const searchInput = this.getSearchInputElement();

        if (searchInput) {
            searchInput.focus();
            this.scrollIntoViewIfNeeded(searchInput);
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
