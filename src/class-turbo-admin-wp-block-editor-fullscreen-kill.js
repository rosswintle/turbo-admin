/**
 * It's impossible to change the setting to off, because the
 * extension's content script runs in a sandbox and can't access
 * the wp object. But we can just toggle the class every time.
 */
export default class TurboAdminWpBlockEditorFullscreenKill {

    constructor() {

        // Don't run on the site editor screen
        if (document.body.classList.contains( 'site-editor-php' )) {
            return;
        }

        const attrObserver = new MutationObserver((mutations) => {
            mutations.forEach(mu => {
                // Check if we already killed fullscreen
                // if (document.body.classList.contains('turbo-admin-killed-fullscreen')) {
                //     return;
                // }

                if (mu.type !== "attributes" && mu.attributeName !== "class") {
                    return;
                }

                if (mu.target.classList.contains('is-fullscreen-mode')) {
                    this.killFullScreenEditor();
                }
            });
        });

        attrObserver.observe(document.body, { attributes: true });

        // Also attempt a kill now in case it's already appeared.
        this.killFullScreenEditor();
    }

    killFullScreenEditor() {
        if (! document.body.classList.contains('is-fullscreen-mode')) {
            return;
        }

        document.body.classList.remove('is-fullscreen-mode');
        document.body.classList.add('turbo-admin-killed-fullscreen');

        const newStyles = document.createElement('style');
        newStyles.innerHTML = "body.turbo-admin-killed-fullscreen .edit-post-fullscreen-mode-close { display: none; }";
        document.body.appendChild(newStyles);
    }
}
