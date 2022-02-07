import TurboAdmin from './class-turbo-admin.js';
import ContentApi from './class-content-api.js';
import Wp from './class-wp.js';
import TurboAdminWpNotices from './class-turbo-admin-wp-notices.js';

const taStorageKey = 'turbo-admin-settings';

// Note that in the extension, the globalThis is not the browser's global scope,
// it is sandboxed. So we can't check across the plugin/extension boundary here.
async function taInit(settings) {

    globalThis.turboAdmin = null;

    // Handle empty settings
    if (typeof(settings[taStorageKey]) === 'undefined') {
        console.log('Weird. Turbo Admin could not find any settings');
        return;
    }
// document.addEventListener('DOMContentLoaded', e => {
// 	turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);
// });

    globalThis.turboAdminOptions = settings[taStorageKey];

    // Get Wp stuff ready
    globalThis.taWp = new Wp();

    // Parts of this init are async.
    await globalThis.taWp.completeInit();

    console.log('Turbo Admin: WP is initialised');

    // Get/set api settings
    globalThis.contentApi = new ContentApi();
    await globalThis.contentApi.discoverApiRoot();

    console.log('Turbo Admin: Content API is initialised');

    globalThis.turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);

    await globalThis.turboAdmin.init();

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
        // 'live-dev-notice': globalThis.wpTurboAdmin['live-dev-notice'],
        'list-table-keyboard-shortcuts': true,
        'hide-notices': true,
        // 'list-table-keyboard-shortcuts': globalThis.wpTurboAdmin['list-table-keyboard-shortcuts'],
        // 'hide-notices': globalThis.wpTurboAdmin['hide-notices']
        'rememberedNoticeIds': JSON.parse(window.localStorage.getItem('rememberedNoticeIds')) ?? new Array()
	}
	await taInit(globalThis.turboAdminOptions);
});
