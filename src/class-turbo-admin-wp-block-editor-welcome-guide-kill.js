/**
 * Kills/auto-removes:
 *  - the Welcome Guide on the post edit screen
 *  - the pattern selector modal on the post edit screen
 *  - the Welcome Panel on the dashboard on new sites
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

                if (!mu.target.classList.contains('modal-open')) {
                    return;
                }

                console.log('Modal detected');
                const welcomeGuide = document.querySelector('.edit-post-welcome-guide');
                const newPagePatterns = document.querySelector('.edit-post-start-page-options__modal');
                const newPagePatterns2 = document.querySelector('.editor-start-page-options__modal-content');

                if (welcomeGuide || newPagePatterns || newPagePatterns2) {
                    this.killWelcomeGuide();
                }
            });
        });

        attrObserver.observe(document.body, { attributes: true });

        // Also attempt a kill now in case it's already appeared.
        this.killWelcomeGuide();

        // Attempt a kill of the dashboard welcome panel
        this.killDashboardWelcomePanel();
    }

    killWelcomeGuide() {
        // Check for welcome guide
        let welcomeGuide = document.querySelector('.edit-post-welcome-guide');
        // Check for new page patterns modal (old: pre-6.6?)
        if (!welcomeGuide) {
            welcomeGuide = document.querySelector('.edit-post-start-page-options__modal');
        }
        // Check for new page patterns model (new: 6.6+)
        if (!welcomeGuide) {
            welcomeGuide = document.querySelector('.editor-start-page-options__modal-content');
        }

        if (welcomeGuide) {
            const closeButton = document.querySelector('.components-modal__header button');
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

    killDashboardWelcomePanel() {
        const welcomePanel = document.getElementById('welcome-panel');
        if (!welcomePanel) {
            return;
        }
        const welcomePanelClose = welcomePanel.querySelector('.welcome-panel-close');
        if (welcomePanelClose) {
            welcomePanelClose.click();
        }
    }
}
