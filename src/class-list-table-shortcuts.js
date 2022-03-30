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
         * @type {HTMLTableElement}
         */
        this.listTable = document.querySelector('.wp-list-table');

        if (! this.listTable) {
            return;
        }

        /**
         * @type {NodeListOf<HTMLTableRowElement>}
         */
        this.tableRows = this.listTable.querySelectorAll('tbody#the-list > tr');

        document.addEventListener('keyup', e => this.handleKeyup(e));
    }

    /**
     *
     * @param {KeyboardEvent} ev
     */
    handleKeyup(ev) {
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }

        if (ev.key === 'j') {
            this.tableMoveDown();
        } else if (ev.key === 'k') {
            this.tableMoveUp();
        } else if (ev.key.toLowerCase() === 'enter' && this.currentRow !== null) {
            this.openTableRowItem();
        }

    }

    tableMoveDown() {
        this.preTableChange();

        // Move down
        if (this.currentRow === null) {
            this.currentRowIndex = 0;
        } else {
            this.currentRowIndex++;
        }
        this.updateTable();
    }

    tableMoveUp() {
        this.preTableChange();

        if (this.currentRowIndex > 0) {
            this.currentRowIndex--;
            this.updateTable();
        }
    }

    preTableChange() {
        if (this.currentRow !== null) {
            this.tableRows[this.currentRowIndex].classList.remove('ta-active-table-row');
        }
    }

    updateTable() {
        this.currentRow = this.tableRows[this.currentRowIndex];

        if (! this.tableRows[this.currentRowIndex].classList.contains('ta-active-table-row')) {
            this.tableRows[this.currentRowIndex].classList.add('ta-active-table-row');
        }
    }

    openTableRowItem() {
        console.log(this);
        /** @type {HTMLAnchorElement} */
        const link = this.currentRow.querySelector('a.row-title');
        if (link) {
            link.click();
        }
    }
}
