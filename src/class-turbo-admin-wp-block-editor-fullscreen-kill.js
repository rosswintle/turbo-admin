/**
 * It's impossible to change the setting to off, because the
 * extension's content script runs in a sandbox and can't access
 * the wp object. But we can just toggle the class every time.
 */
export default class TurboAdminWpBlockEditorFullscreenKill {

    constructor() {
        // This needs a slight delay as it needs to happen after the editor
        // is initialised
        setTimeout(() => {
            document.body.classList.remove('is-fullscreen-mode');
            document.body.classList.add('turbo-admin-killed-fullscreen');

            const newStyles = document.createElement('style');
            newStyles.innerHTML = "body.turbo-admin-killed-fullscreen .edit-post-fullscreen-mode-close { display: none; }";
            document.body.appendChild(newStyles);
        }, 400);
    }

}
