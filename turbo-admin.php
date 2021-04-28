<?php

/**
 * Plugin Name:     Turbo Admin
 * Plugin URI:      PLUGIN SITE HERE
 * Description:     PLUGIN DESCRIPTION HERE
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
	// wp_enqueue_script('turbo-admin-main', plugin_dir_url(__FILE__) . 'main.js', [], null, true);
	wp_enqueue_style('turbo-admin-styles', plugin_dir_url(__FILE__) . 'turbo-admin.css', []);
}

add_action('admin_print_footer_scripts', 'ta_add_admin_module_script', 10, 0);
function ta_add_admin_module_script()
{
?>
	<script type="module" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'main.js'); ?>"></script>
<?php
}
