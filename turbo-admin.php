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
 * - Add submenu items
 * - Up/Down/Select
 * - General refactor to objects
 */

function ta_get_admin_menu()
{
	global $menu, $submenu, $_registered_pages, $_parent_pages;
	ray($_registered_pages);
	ray($_parent_pages);

	return $menu;
}

add_action('admin_enqueue_scripts', 'ta_add_admin_scripts', 10, 1);

function ta_add_admin_scripts()
{
	wp_enqueue_script('fusejs', 'https://cdn.jsdelivr.net/npm/fuse.js@6.4.6', [], null, true);
	wp_enqueue_script('turbo-admin', plugin_dir_url(__FILE__) . 'turbo-admin.js', ['fusejs'], null, true);
}

add_action('admin_footer', 'ta_output_palette_markup');

function ta_output_palette_markup()
{

?>
	<div id="ta-command-palette-container">
		<div id="ta-command-palette">
			<input id="ta-command-palette-input" name=" ta-command-palette-input" type="text" />
			<ul id="ta-command-palette-items">
				<?php foreach (ta_get_admin_menu() as $item) : ?>
					<?php if (!empty($item[0])) : ?>
						<li>
							<?php echo $item[0]; ?>
						</li>
					<?php endif; ?>
				<?php endforeach; ?>
			</ul>
		</div>
	</div>
	<style>
		#ta-command-palette-container {
			display: none;
			background-color: rgba(0, 0, 0, 0.4);
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			flex-direction: column;
			justify-content: space-around;
			align-items: center;
			z-index: 999999;
		}

		#ta-command-palette-container.active {
			display: block;
		}

		#ta-command-palette {
			display: flex;
			flex-direction: column;
			background-color: #000;
			width: 60%;
			max-width: 600px;
			padding: 1rem;
			border-radius: 8px;
			position: absolute;
			top: 10vh;
			left: 50%;
			transform: translateX(-50%);
		}

		#ta-command-palette-input {
			background-color: #333;
			border: 0 none;
			border-radius: 6px;
			font-size: 1.2rem;
			display: block;
			margin: 0 0 0.8rem 0;
			padding: 0.5rem;
			width: 100%;
			color: #FFF;
			outline: none;
		}

		#ta-command-palette-items {
			background-color: #000;
			border-radius: 8px;
			font-size: 1.2rem;
			display: block;
			margin: 0;
			padding: 0 0.5rem;
			width: 100%;
			height: 80%;
			max-height: 300px;
			overflow: scroll;
			color: #FFF;
		}

		#ta-command-palette li {
			display: block;
			padding: 0.5rem;
		}
	</style>
<?php
}
