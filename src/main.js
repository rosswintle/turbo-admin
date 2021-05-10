import TurboAdmin from './class-turbo-admin.js';

// Note that in the extension, the globalThis is not the browser's global scope,
// it is sandboxed. So we can't check across the plugin/extension boundary here.
globalThis.turboAdmin = null;
globalThis.turboAdminOptions = {
	// wpTurboAdmin is set using wp_localize_script
	shortcutKeys: globalThis.wpTurboAdmin.keys
}
document.addEventListener('DOMContentLoaded', e => {
	turboAdmin = new TurboAdmin(globalThis.turboAdminOptions);
});
