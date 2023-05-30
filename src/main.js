import TurboAdmin from './class-turbo-admin.js';
import ContentApi from './apis/class-content-api.js';
import Wp from './class-wp.js';
import TurboAdminWpNotices from './class-turbo-admin-wp-notices.js';
import WoocommerceApi from './apis/class-woocommerce-api.js';
import GravityFormsApi from './apis/class-gravity-forms-api.js';

const taStorageKey = 'turbo-admin-settings';

let debugMode = false;

window.turboAdminLog = function() {
    if (debugMode) {
        console.log(...arguments);
    }
}

window.turboAdminIsExtension = function() {
    return false;
}

// Use this to clear storage
// chrome.storage.local.remove(taStorageKey).then();

// Note that in the extension, the globalThis is not the browser's global scope,
// it is sandboxed. So we can't check across the plugin/extension boundary here.
async function taInit(settings) {

    if (typeof(globalThis.turboAdmin) !== 'undefined') {
        // Already initialised for some reason
        return;
    }
    globalThis.turboAdmin = null;

    // Handle empty settings
    if (typeof(settings[taStorageKey]) === 'undefined') {
        console.log('Weird. Turbo Admin could not find any settings');
        return;
    }

    globalThis.turboAdminOptions = settings[taStorageKey];

    // Set debug mode
    debugMode = globalThis.turboAdminOptions['debug-mode'];

    turboAdminLog('Preparing Turbo Admin');

    // Get Wp stuff ready
    globalThis.taWp = new Wp();

    // Parts of this init are async.
    await globalThis.taWp.completeInit();

    turboAdminLog('Turbo Admin: WP is initialised');

    // Get/set api settings
    globalThis.contentApi = new ContentApi();
    await globalThis.contentApi.discoverApiRoot();
    await globalThis.contentApi.discoverPostTypes();
    globalThis.woocommerceApi = new WoocommerceApi();
    globalThis.gravityFormsApi = new GravityFormsApi();

    turboAdminLog('Turbo Admin: Content API is initialised');

    globalThis.turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);
    await globalThis.turboAdmin.init();

    // This needs all the APIs to be ready
    await globalThis.turboAdmin.activatePlugins();

    if (settings[taStorageKey]['hide-notices']) {
        globalThis.turboAdminWpNotices = new TurboAdminWpNotices(settings[taStorageKey].rememberedNoticeIds);
    }
}

/**
 * This is plugin-specific. It should not be present in the extension code.
 */
document.addEventListener('DOMContentLoaded', async e => {
	globalThis.turboAdminOptions = {};
	globalThis.turboAdminOptions[taStorageKey] = {
		// wpTurboAdmin is set using wp_localize_script
		shortcutKeys: globalThis.wpTurboAdmin.keys,
        // These don't apply to the plugin version
        'block-editor-fullscreen-disable': false,
        'block-editor-welcome-screen-kill': false,
        // I don't think we'll do this in the plugin as the code would be SO different.
        'live-dev-notice': false,
        'list-table-keyboard-shortcuts': globalThis.wpTurboAdmin['listTableShortcuts'] === '1',
        'hide-notices': globalThis.wpTurboAdmin['hideNotices'] === '1',
        'rememberedNoticeIds': JSON.parse(window.localStorage.getItem('rememberedNoticeIds')) ?? new Array(),
        'barkeeper': globalThis.wpTurboAdmin['barkeeper'] === '1',
        'admin-bar-search': globalThis.wpTurboAdmin['adminBarSearch'] === '1',
        'debug-mode': globalThis.wpTurboAdmin['debugMode'] === '1',
	}
	await taInit(globalThis.turboAdminOptions);
});
