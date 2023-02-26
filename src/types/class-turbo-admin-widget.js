export default class TurboAdminWidget {

    constructor( id, title, contentElem ) {
        this.id = id;
        this.title = title;
        this.contentElem = contentElem;

        this.addWidget();
    }

    buildWidgetContainer() {
        const postbox = document.createElement('div');
        postbox.id = this.id;
        postbox.classList.add('postbox');

        const header = document.createElement('div');
        header.classList.add('postbox-header');

        postbox.append(header);

        const heading = document.createElement('h2');
        heading.classList.add('hndle', 'ui-sortable-handle');
        heading.innerText = this.title;

        header.append(heading);

        const inside = document.createElement('div');
        inside.classList.add('inside');

        postbox.append(inside);

        inside.append(this.contentElem);

        return postbox;
    }

    addWidget() {
        const widgetAreaContainer = document.getElementById('postbox-container-1');
        const widgetArea = widgetAreaContainer.querySelector('#normal-sortables');

        const newWidgetContainer = this.buildWidgetContainer();

        widgetArea.prepend( newWidgetContainer );
    }

}
