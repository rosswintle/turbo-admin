<?php
/**
 * Plugin Name:     Turbo Admin
 * Plugin URI:      https://oikos.digital/turbo-admin
 * Description:     The command palette that gives super fast access to your WordPress Dashboard.
 * Author:          Ross Wintle
 * Author URI:      https://rosswintle.uk/
 * Text Domain:     turbo-admin
 * Domain Path:     /languages
 * Version:         0.1.3
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

function add_admin_scripts()
{
	wp_enqueue_script('turbo-admin-scripts', plugin_dir_url(__FILE__) . 'dist/main.min.js', [], null, true);
	wp_enqueue_style('turbo-admin-styles', plugin_dir_url(__FILE__) . 'turbo-admin.css', []);
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
