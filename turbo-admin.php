<?php

/**
 * Plugin Name:     Turbo Admin
 * Plugin URI:      https://oikos.digital/turbo-admin
 * Description:     The command palette that gives super fast access to your WordPress Dashboard.
 * Author:          Ross Wintle
 * Author URI:      https://rosswintle.uk/
 * Text Domain:     turbo-admin
 * Domain Path:     /languages
 * Version:         0.1.0
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

add_action('admin_enqueue_scripts', 'ta_add_admin_scripts', 10, 1);

function ta_add_admin_scripts()
{
	wp_enqueue_script('fusejs', 'https://cdn.jsdelivr.net/npm/fuse.js@6.4.6', [], null, true);
	wp_enqueue_style('turbo-admin-styles', plugin_dir_url(__FILE__) . 'turbo-admin.css', []);
}

add_action('admin_print_footer_scripts', 'ta_add_admin_module_script', 10, 0);
function ta_add_admin_module_script()
{
?>
	<script type="module" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'main.js'); ?>"></script>
<?php
}

add_action('admin_bar_menu', 'ta_add_admin_bar_item', 1000);
function ta_add_admin_bar_item($admin_bar)
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
