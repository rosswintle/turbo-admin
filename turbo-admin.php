<?php

/**
 * Plugin Name:     Turbo Admin
 * Plugin URI:      https://oikos.digital/turbo-admin
 * Description:     The command palette that gives super fast access to your WordPress Dashboard.
 * Author:          Ross Wintle
 * Author URI:      https://rosswintle.uk/
 * Text Domain:     turbo-admin
 * Domain Path:     /languages
 * Version:         1.0.0
 *
 * @package         Turbo_Admin
 */

/* Todo:
 *
 * ❓ Composer and autoloading (probably not needed after refactor to JS)
 * ✅ Add submenu items
 * - Filter items to allow people to hook in their own
 * ✅ Up/Down/Select
 * - General refactor to objects
 * ✅ Check roles/permissions (not needed now we're pure JS)
 * ✅ Scroll selected item into view
 * ✅ Allow user selectable keyboard shortcut
 */

namespace TurboAdmin;

add_action('admin_enqueue_scripts', 'TurboAdmin\add_admin_scripts', 10, 1);
add_action('wp_enqueue_scripts', 'TurboAdmin\add_admin_scripts', 10, 1);

function add_admin_scripts()
{
	if (is_user_logged_in()) {
		$userShortcutKeys = userShortcutKeys();

		// We will pass an array of shortcut key objects into the JS
		$shortcutKeys = [
			$userShortcutKeys
		];

		wp_enqueue_script('turbo-admin-scripts', plugin_dir_url(__FILE__) . 'dist/main.min.js', [], null, true);
		wp_enqueue_style('turbo-admin-styles', plugin_dir_url(__FILE__) . 'turbo-admin.css', []);

		wp_localize_script( 'turbo-admin-scripts', 'wpTurboAdmin', [
			'keys' => $shortcutKeys,
		] );
	}
}

add_action('admin_bar_menu', 'TurboAdmin\add_admin_bar_item', 1000);
function add_admin_bar_item($admin_bar)
{
	$userShortcutKeys = userShortcutKeys();

	$keysTextArray = [];

	if ($userShortcutKeys['meta']) {
		$keysTextArray[] = 'Cmd';
	}
	if ($userShortcutKeys['alt']) {
		$keysTextArray[] = 'Alt';
	}
	if ($userShortcutKeys['ctrl']) {
		$keysTextArray[] = 'Ctrl';
	}
	if ($userShortcutKeys['shift']) {
		$keysTextArray[] = 'Shift';
	}
	$keysTextArray[] = strtoupper($userShortcutKeys['key']);

	$keysText = implode('-', $keysTextArray);

	$admin_bar->add_menu(array(
		'id'    => 'turbo-admin',
		'parent' => null,
		'group'  => null,
		'title' => '<span class="ab-icon" style="margin-right: 0;"><img src="' . plugin_dir_url(__FILE__) . '/images/snail.svg' . '" style="display: block; width: 24px; height: 24px;"></span>',
		'href'  => null,
		'meta' => [
			'title' => sprintf(__('Turbo admin is installed! Use %s to open the command palette.', 'turbo-admin'), $keysText), //This title will show on hover
		]
	));
}

add_action('show_user_profile', 'TurboAdmin\show_profile_fields');
add_action('edit_user_profile', 'TurboAdmin\show_profile_fields');

function show_profile_fields($user)
{
	$shortcut = get_user_meta($user->ID, 'turbo-admin-shortcut', true);
	if (empty($shortcut)) {
		$shortcut = defaultShortcutKeys();
	}
?>
	<h3><?php _e('Turbo Admin settings', 'turbo_admin') ?></h3>
	<table class="form-table">
		<tr>
			<th><label for="turbo-admin-shortcut"><?php _e('Keyboard shortcut', 'turbo_admin') ?></label></th>
			<td>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-meta-key" <?php checked($shortcut['meta']) ?>></input>
					<?php _e('Cmd (Mac only)', 'turbo_admin') ?>
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-alt-key" <?php checked($shortcut['alt']) ?>></input>
					<?php _e('Alt/option', 'turbo_admin') ?>
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-ctrl-key" <?php checked($shortcut['ctrl']) ?>></input>
					<?php _e('Ctrl', 'turbo_admin') ?>
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-shift-key" <?php checked($shortcut['shift']) ?>></input>
					<?php _e('Shift', 'turbo_admin') ?>
				</label>
				<input type="text" required name="turbo-admin-shortcut" id="turbo-admin-shortcut" minLength="1" maxLength="1" value="<?php echo esc_attr($shortcut['key']); ?>" class="regular-text" /><br />
				<span class="description"><?php _e('Please enter the keyboard shortcut you want to use to activate the Turbo Admin command palette.<br>
				Do not choose a keyboard combination that your browser already uses.', 'turbo_admin') ?></span>
			</td>
		</tr>
	</table>

<?php
}

add_action('personal_options_update', 'TurboAdmin\save_extra_profile_fields');
add_action('edit_user_profile_update', 'TurboAdmin\save_extra_profile_fields');

function save_extra_profile_fields($user_id)
{

	if (!current_user_can('edit_user', $user_id)) {
		return false;
	}

	$shortcut = [];

	$shortcut['meta'] = isset($_POST['turbo-admin-meta-key']);
	$shortcut['alt'] = isset($_POST['turbo-admin-alt-key']);
	$shortcut['ctrl'] = isset($_POST['turbo-admin-ctrl-key']);
	$shortcut['shift'] = isset($_POST['turbo-admin-shift-key']);
	$shortcut['key'] = isset($_POST['turbo-admin-shortcut']) ? esc_attr($_POST['turbo-admin-shortcut']) : 'P';

	update_user_meta($user_id, 'turbo-admin-shortcut', $shortcut);
}

/*
 * This returns the user-specified key combo if set, or the default one if not
 */
function userShortcutKeys() {
	$userShortcutKeys = get_user_meta(get_current_user_id(), 'turbo-admin-shortcut', true);

	if (! $userShortcutKeys) {
		return defaultShortcutKeys();
	}

	return $userShortcutKeys;
}

function defaultShortcutKeys() {
	$shortcut = [
		'meta' => false,
		'alt' => true,
		'ctrl' => true,
		'shift' => true,
		'key' => 'P',
	];
	if (isUserOnMacOs()) {
		$shortcut['meta'] = true;
		$shortcut['ctrl'] = false;
	}
	return $shortcut;
}

function isUserOnMacOs() {
	return strpos($_SERVER['HTTP_USER_AGENT'], "Mac") !== false;
}
