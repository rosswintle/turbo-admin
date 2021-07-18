/**
 *
 */
export default class TurboAdminWpBlockEditorWelcomeGuideKill {

    constructor() {
        // This needs a slight delay as it needs to happen after the editor
        // is initialised
        setTimeout(() => {
            const welcomeGuide = document.querySelector('.edit-post-welcome-guide');
            if (welcomeGuide) {
                const closeButton = welcomeGuide.querySelector('.components-modal__header button');
                if (closeButton) {
                    closeButton.click();
                }
            }
        }, 400);
    }

}
