export default class TurboAdminWpNotices {

    // TODO: Handle empty IDS. Can we identify unique selectors?
    // See spinup!
    // Also need to only show move to panel if we can (i.e. if there's a way
    // to identify it))
    constructor(rememberedNoticeIds) {

        // Bail if we aren't in the admin
        if (! document.querySelector('body.wp-admin')) {
            return;
        }

        /*
        * These are the global notice selectors
        */
        this.noticeSelectors = [
            '#wpbody-content > .notice',
            '#wpbody-content > .wrap > .notice',
            '#wpbody-content > .wrap > .updated',
            '#gf_dashboard_message', // Gravity forms
            '.jitm-banner', //
            '.fs-notice', // I get this in Replyable
            '#updraft-dashnotice', // Updraft backups
            '.woocommerce-message', // WooCommerce
            '#akismet_setup_prompt', // Akismet
            '#wf-onboarding-plugin-header', // WordFence onboard
            '.llar-notice-review' // Limit Login Attempts reloaded
        ];

        /*
         * These selectors are allowed (unless explicitly denied)
         */
        this.allowedClasses = [
            '.notice-success',
            '.notice-error',
            '.notice-failure',
            '.updated',
        ]

        this.noticesPanelInner = null;

        if (rememberedNoticeIds) {
            this.rememberedNoticeIds = rememberedNoticeIds.length > 0 ? rememberedNoticeIds : [];
        } else {
            this.rememberedNoticeIds = [];
        }

        const toolbar = document.getElementById('wpadminbar');

        if (!toolbar) {
            return;
        }

        if (rememberedNoticeIds && rememberedNoticeIds.length > 0) {
            rememberedNoticeIds.forEach(id => {
                if ('string' === typeof(id) && id.length > 0) {
                    this.noticeSelectors.push('#' + id);
                }
            });
        }

turboAdminLog('Notice Selectors', this.noticeSelectors);
        const notices = document.querySelectorAll(this.noticeSelectors.join(','));
turboAdminLog('Notices', notices);

        // Add buttons to notices that can be moved
        notices.forEach(notice => {
            this.maybeAddIdToNotice(notice);
            this.maybeAddMoveButtonToNotice.call(this, notice);
        });

        const noticesToHide = Array.from(notices).filter( this.noticeShouldBeHidden.bind(this) );

        turboAdminLog('Notices to hide', noticesToHide)

        /**
         * Build the notices wrapper
         */
        /** @type {HTMLDivElement} */
        const noticesLinkWrapper = document.createElement('div');
        noticesLinkWrapper.id = 'ta-notices-link-wrap';
        noticesLinkWrapper.classList.add('hide-if-no-js', 'screen-meta-toggle');
        noticesLinkWrapper.style.margin='0 0 0 6px';
        noticesLinkWrapper.style.float='left';
        if (noticesToHide.length === 0) {
            noticesLinkWrapper.style.display='none';
        }

        /**
         * Add button
         */
        /** @type {HTMLButtonElement} */
        const noticesButton = document.createElement('button');
        noticesButton.type='button';
        noticesButton.id='ta-notices-link';
        noticesButton.classList.add('button', 'show-settings');
        noticesButton.innerHTML='Notices <span id="ta-notice-count">' + noticesToHide.length + '</span>';
        noticesButton.setAttribute('aria-controls', 'ta-notices-wrap');

        // This should replicate the functionality from wp-admin/js/common.js
        // as closely as possible. But note that we can't access the common.js
        // functions.
        noticesButton.addEventListener('click', this.toggleNoticesPanel.bind(this), false);

        /**
         * Add button to the link wrapper
         */
        noticesLinkWrapper.appendChild(noticesButton);

        /**
         * Add the link wrapper to the screen-meta-links section
         */
        const screenMetaLinks = document.getElementById('screen-meta-links');
        screenMetaLinks.appendChild(noticesLinkWrapper);

        /**
         * Build the panel
         */
        const noticesPanel = document.createElement('div');

        noticesPanel.id='ta-notices-wrap';
        noticesPanel.style.display='none';
        noticesPanel.dataset.open='no';

        this.noticesPanelInner = document.createElement('div');
        this.noticesPanelInner.id = 'ta-notices-panel-inner';

        noticesToHide.forEach(this.hideNotice.bind(this));

        /**
         * Add wrap to the meta area
         */
        noticesPanel.appendChild(this.noticesPanelInner);
        const screenMeta = document.getElementById('screen-meta');
        screenMeta.appendChild(noticesPanel);

        // Set up events on the new screen-meta item
        // if (window.screenMeta) {
        //     window.screenMeta.init();
        // }

        // Add a mutation observer to check for notices added by JavaScript
        // this.addObserver();
    }

    addObserver() {
        const observer = new MutationObserver( this.handleMutations.bind(this) );
        observer.observe(document.getElementById('wpbody-content'), {
            childList: true,
            subtree: true
        });
    }

    handleMutations(mutations, observer) {
        mutations.forEach( mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach( node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        console.log('MUTATING!!!' + node.id);
                        // this.maybeAddIdToNotice(node);
                        // this.maybeAddMoveButtonToNotice(node);
                        // this.maybeHideNotice(node);
                    }
                });
            }
        });
    }

    // Does the allowedClasses list say that this notice should be shown?
    keepNotice(noticeElem) {
        return noticeElem.matches(this.allowedClasses.join(', '));
    }

    rememberNotice(ev) {
        const noticesLinkWrap = document.getElementById('ta-notices-link-wrap');
        const panel = document.getElementById('wp-admin-bar-ta-notices');
        const panelInner = document.getElementById('ta-notices-panel-inner');
        const countElem = document.getElementById('ta-notice-count');
        const count = parseInt(countElem.innerText, 10);
        const notice = ev.target.closest(this.noticeSelectors.join(','));
        const noticeId = notice.id;
        turboAdminLog(`Remembering ${noticeId}`);
        panelInner.appendChild(notice);
        if (count === 0) {
            noticesLinkWrap.style.display = 'block';
        }

        this.updateScreenMetaHeight();

        countElem.innerText = parseInt(countElem.innerText, 10) + 1;

        this.saveRememberedNotice(noticeId);
    }

    noticeShouldBeHidden(notice) {
        if (this.rememberedNoticeIds.includes(notice.id)) {
            return true;
        }

        if (this.keepNotice(notice)) {
            return false;
        }

        // Invisible
        if (
            notice.offsetHeight === 0 ||
            notice.offsetWidth === 0
        ) {
            return false;
        }

        return true;
    }

    saveRememberedNotice(noticeId) {
        this.rememberedNoticeIds.push(noticeId);

        if ('object' === typeof(chrome)) {
            chrome.runtime.sendMessage({
                'action': 'rememberNotice',
                'noticeId': noticeId,
            });
        } else {
            window.localStorage.setItem('rememberedNoticeIds', JSON.stringify(this.rememberedNoticeIds));
        }
    }

    forgetNotice(ev) {
        const noticesLinkWrap = document.getElementById('ta-notices-link-wrap');
        const panelInner = document.getElementById('ta-notices-panel-inner');
        const countElem = document.getElementById('ta-notice-count');
        const count = parseInt(countElem.innerText, 10);
        const notice = ev.target.closest(this.noticeSelectors.join(','));
        const noticeId = notice.id;
        turboAdminLog(`Forgetting ${noticeId}`);

        notice.remove();

        const message = document.createElement('div');
        const p = document.createElement('p');
        message.classList.add('notice', 'ta-forget-notice-message');
        p.textContent = 'Notice will be back in dashboard on next page load';
        message.appendChild(p);
        panelInner.appendChild(message);

        this.updateScreenMetaHeight();

        // I was going to to this, but we need to keep the notice about
        // where the notice has gone.
        // if (count === 1) {
        //     noticesLinkWrap.style.display = 'none';
        // }

        countElem.innerText = (count - 1).toString();
        this.saveForgottenNotice(noticeId);
    }

    saveForgottenNotice(noticeId) {
        this.rememberedNoticeIds.push(noticeId);

        if ('object' === typeof(chrome)) {
            chrome.runtime.sendMessage({
                'action': 'rememberNotice',
                'noticeId': noticeId,
            });
        } else {
            this.rememberedNoticeIds = this.rememberedNoticeIds.filter( id => id !== noticeId );
            window.localStorage.setItem('rememberedNoticeIds', JSON.stringify(this.rememberedNoticeIds));
        }
    }

    /*
     * For notices without IDs we'll see if we can add an ID that's a hash of their classlist
     */
    maybeAddIdToNotice(noticeElem) {
        if (noticeElem.id && noticeElem.id !== '' && noticeElem.id !=='message') {
            return;
        }

        const classes = noticeElem.classList;
        noticeElem.id = Array.from(noticeElem.classList).join('-');
    }

    /**
     * Add buttons to notices that we want to be able to move to the panel
     */
    maybeAddMoveButtonToNotice(noticeElem) {
        if (this.keepNotice(noticeElem)) {
            const rememberButton = document.createElement('button');
            rememberButton.classList.add('ta-remember-notice-button');
            rememberButton.innerText = 'Move to panel';

            const forgetButton = document.createElement('button');
            forgetButton.classList.add('ta-forget-notice-button');
            forgetButton.innerText = 'Move to dashboard';

            noticeElem.classList.add('ta-added-pos-relative');

            noticeElem.appendChild(rememberButton);
            noticeElem.appendChild(forgetButton);

            rememberButton.addEventListener('click', this.rememberNotice.bind(this), false, true);
            forgetButton.addEventListener('click', this.forgetNotice.bind(this), false, true);
        }
    }

    maybeHideNotice(noticeElem) {
        if (this.noticeShouldBeHidden(noticeElem) && !noticeElem.classList.contains('ta-notice-hidden')) {
            this.hideNotice(noticeElem);
        }
    }

    hideNotice(noticeElem) {
        noticeElem.classList.add('ta-notice-hidden');
        // WPCore's common.js will re-add the notice below the dashboard header unless it has a .inline class.
        // It does: $( 'div.updated, div.error, div.notice' ).not( '.inline, .below-h2' ).insertAfter( $headerEnd );
        noticeElem.classList.add('inline');
        // See Toolbelt's implementation: https://github.com/BinaryMoon/wp-toolbelt/blob/dev/modules/tidy-notifications/src/js/script.js
        this.noticesPanelInner.append(noticeElem);
    }

    /**
     * Detect if WordPress has already applied event handlers to our new screen meta button.
     *
     * If it has then WordPress/backbone.js will handle the animation and we won't have to.
     *
     * @returns {boolean}
     */
    wordpressScreenMetaEventsExist() {
        return 'object' === typeof(window.screenMeta) && window.screenMeta.toggles.filter('#ta-notices-link').length > 0;
    }

    updateScreenMetaHeight() {
        // Don't do this if we're relying on backbone's animation
        if (this.wordpressScreenMetaEventsExist()) {
            return;
        }

        const screenMeta = document.getElementById('screen-meta');
        const noticesPanel = document.getElementById('ta-notices-wrap');
        const height = noticesPanel.offsetHeight;
        screenMeta.style.maxHeight = height.toString(10) + 'px';
    }

    toggleNoticesPanel(ev) {
        // We may be in the plugin in which case we don't want to run our handler if there's
        // a backbone handler on the button.
        if (this.wordpressScreenMetaEventsExist()) {
            return;
        }
        // Otherwise we mimic the swipe down animation.
        const animationSeconds = 0.3;
        const screenMeta = document.getElementById('screen-meta');
        const noticesPanel = document.getElementById('ta-notices-wrap');
        if (noticesPanel.dataset.open === 'no') {
            this.toggleOtherScreenMetaTabs();
            // Don't ask... just DON'T ask!
            noticesPanel.dataset.open = 'yes';
            screenMeta.style.transition = `max-height ${animationSeconds.toString(10)}s`;
            screenMeta.style.maxHeight = '0';
            screenMeta.style.overflow = 'hidden';
            screenMeta.style.display = 'block';
            noticesPanel.style.display = 'block';
            const height = noticesPanel.offsetHeight;
            screenMeta.style.maxHeight = height.toString(10) + 'px';
            // setTimeout(() => {
            //     // Nothing to do here.
            // }, animationSeconds * 1000);
        } else {
            noticesPanel.dataset.open = 'no';
            const height = noticesPanel.offsetHeight;
            screenMeta.style.maxHeight = '0';
            setTimeout(() => {
                noticesPanel.style.display = '';
                screenMeta.style.display = '';
                screenMeta.style.transition = '';
                screenMeta.style.overflow = '';
                screenMeta.style.maxHeight = '';
                this.toggleOtherScreenMetaTabs();
            }, animationSeconds * 1000);
        }

    }

    toggleOtherScreenMetaTabs() {
        const otherTabs = document.querySelectorAll('#screen-meta-links .screen-meta-toggle:not(#ta-notices-link-wrap)');
        otherTabs.forEach( (tab) => {
            if (tab.style.visibility === 'hidden') {
                tab.style.visibility = '';
            } else {
                tab.style.visibility = 'hidden';
            }
        } );
    }
}
