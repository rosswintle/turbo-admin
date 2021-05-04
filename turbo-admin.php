<?php

/**
 * Plugin Name:     Turbo Admin
 * Plugin URI:      https://oikos.digital/turbo-admin
 * Description:     The command palette that gives super fast access to your WordPress Dashboard.
 * Author:          Ross Wintle
 * Author URI:      https://rosswintle.uk/
 * Text Domain:     turbo-admin
 * Domain Path:     /languages
 * Version:         0.1.5
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
 * - Allow user selectable keyboard shortcut
 */

namespace TurboAdmin;

add_action('admin_enqueue_scripts', 'TurboAdmin\add_admin_scripts', 10, 1);
add_action('wp_enqueue_scripts', 'TurboAdmin\add_admin_scripts', 10, 1);

function add_admin_scripts()
{
	if (is_user_logged_in()) {
		wp_enqueue_script('turbo-admin-scripts', plugin_dir_url(__FILE__) . 'dist/main.min.js', [], null, true);
		wp_enqueue_style('turbo-admin-styles', plugin_dir_url(__FILE__) . 'turbo-admin.css', []);
	}
}


add_action('admin_bar_menu', 'TurboAdmin\add_admin_bar_item', 1000);
function add_admin_bar_item($admin_bar)
{
	$admin_bar->add_menu(array(
		'id'    => 'turbo-admin',
		'parent' => null,
		'group'  => null,
		'title' => '<span class="ab-icon" style="margin-right: 0;"><img src="' . plugin_dir_url(__FILE__) . '/images/snail.svg' . '" style="display: block; width: 24px; height: 24px;"></span>',
		'href'  => null,
		'meta' => [
			'title' => __('Turbo admin is installed! Use Ctrl-Alt-Shift-P (or Cmd-Alt-Shift-P for Mac) to open the command palette.', 'turbo-admin'), //This title will show on hover
		]
	));
}

add_action('show_user_profile', 'TurboAdmin\show_profile_fields');
add_action('edit_user_profile', 'TurboAdmin\show_profile_fields');

function show_profile_fields($user)
{
	$shortcut = get_user_meta($user->ID, 'turbo-admin-shortcut', true);
	if (empty($shortcut)) {
		$shortcut = [
			'meta' => true,
			'alt' => true,
			'ctrl' => false,
			'shift' => true,
			'key' => 'P',
		];
	}
?>
	<h3>Turbo Admin settings</h3>
	<table class="form-table">
		<tr>
			<th><label for="turbo-admin-shortcut"><?php _e('Keyboard shortcut', 'turbo_admin') ?></label></th>
			<td>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-meta-key" <?php checked($shortcut['meta']) ?>></input>
					Ctrl/Cmd
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-alt-key" <?php checked($shortcut['alt']) ?>></input>
					Alt/option
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-ctrl-key" <?php checked($shortcut['ctrl']) ?>></input>
					Ctrl
				</label>
				<label style="margin-right: 18px;">
					<input type="checkbox" name="turbo-admin-shift-key" <?php checked($shortcut['shift']) ?>></input>
					Shift
				</label>
				<input type="text" required name="turbo-admin-shortcut" id="turbo-admin-shortcut" minLength="1" maxLength="1" value="<?php echo esc_attr($shortcut['key']); ?>" class="regular-text" /><br />
				<span class="description">Please enter the keyboard shortcut you want to use to activate the Turbo Admin command palette.</span>
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
