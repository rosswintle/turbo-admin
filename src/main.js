import TurboAdmin from './class-turbo-admin.js';
import ContentApi from './class-content-api.js';
import Wp from './class-wp.js';

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
document.addEventListener('DOMContentLoaded', e => {
	turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);
});

    globalThis.turboAdminOptions = settings[taStorageKey];

    // Get Wp stuff ready
    globalThis.taWp = new Wp();

    // Get/set api settings
    globalThis.contentApi = new ContentApi();
    await globalThis.contentApi.discoverApiRoot();

    globalThis.turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);
}

document.addEventListener('DOMContentLoaded', async e => {
	globalThis.turboAdminOptions = {};
	globalThis.turboAdminOptions[taStorageKey] = {
		// wpTurboAdmin is set using wp_localize_script
		shortcutKeys: globalThis.wpTurboAdmin.keys,
        // These don't apply to the plugin version
        'block-editor-fullscreen-disable': false,
        'block-editor-welcome-screen-kill': false,
	}
	await taInit(globalThis.turboAdminOptions);
});
