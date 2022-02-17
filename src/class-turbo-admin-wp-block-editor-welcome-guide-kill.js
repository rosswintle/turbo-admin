/**
 *
 */
export default class TurboAdminWpBlockEditorWelcomeGuideKill {

    constructor() {

        const attrObserver = new MutationObserver((mutations) => {
            mutations.forEach(mu => {
                // Check if we already killed the modal
                if (document.body.classList.contains('ta-killed-post-welcome-guide')) {
                    return;
                }

                if (mu.type !== "attributes" && mu.attributeName !== "class") {
                    return;
                }

                if (! mu.target.classList.contains('modal-open')) {
                    return;
                }

                const welcomeGuide = document.querySelector('.edit-post-welcome-guide');
                if (welcomeGuide) {
                    this.killWelcomeGuide();
                }
            });
        });

        attrObserver.observe(document.body, { attributes: true });

        // Also attempt a kill now in case it's already appeared.
        this.killWelcomeGuide();
    }

    killWelcomeGuide() {
        const welcomeGuide = document.querySelector('.edit-post-welcome-guide');
        if (welcomeGuide) {
            const closeButton = welcomeGuide.querySelector('.components-modal__header button');
            if (closeButton) {
                closeButton.click();
                /*
                 * Also add a class to body so we don't do it again - subsequent modals
                 * will need to be shown as they will have been user-initiated.
                 */
                document.body.classList.add('ta-killed-post-welcome-guide');
            }
        }
    }
}
