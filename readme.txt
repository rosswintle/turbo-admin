=== Turbo Admin ===
Contributors: magicroundabout
Donate link: https://ko-fi.com/magicroundabout
Tags: menu, commands, shortcuts
Requires at least: 4.9
Tested up to: 6.2
Requires PHP: 7.4
Stable tag: 1.13.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Description ==

Work faster with WordPress using a quick-access command palette and a collection of Dashboard improvements. Simply install, activate and go!

Ugh, this Dashboard menu is so cluttered?

Where is everything?

Is it in Tools? Or Settings? Or some menu of it's own?

How am I supposed to work with this clutter?

## If the WordPress Dashboard is slowing you down, Turbo Admin is here to speed you up.

Turbo Admin's main features are:

* A fast-action, keyboard driven command palette: Think Apple Spotlight, or Alfred, but in WordPress!
* The command palette is pop-up/modal by default, but has an option to be present in the admin bar.
* A "barkeeper" that hides non-critical admin-bar items in a slide-out panel.
* (Experimental) Notice hiding: Tidy your dashboard by hiding admin notices in a separate, slide-out panel.
* (Experimental/Beta): List table keyboard shortcuts - use vim-like keys to navigate lsit tables.

If you love this plugin, you can get Turbo Admin on ALL your sites without needing to install the plugin, PLUS additional premium features, with [the browser extension version](https://turbo-admin.com/)!

PLUS the browser extension has features not present in the plugin. Some features only make sense in the extension, others are considered "premium" and are only available in the browser extension.

* WooCommerce search (premium - extension only)
* Gravity Forms Search (premium - extension only)
* Full screen block editor killer
* Block editor welcome guide remover
* Live/dev site labels

Remember, the browser extension works everywhere that it can detect WordPress, without needing a plugin. And it carries your preferences with you! It's WordPress, your way!

[Check out the Browser Extension and try it for free](https://turbo-admin.com/)

## Usage

Install, activate and go!

## Using the Command Palette

The command palette is a keyboard-driven, pop-up menu.

The default keyboard shortcut to activate the command palette is:

* Windows: Ctrl-Alt-Shift-P (Linux also?)
* Mac: Cmd-Alt-Shift-P

You can customise the keyboard combination used in the settings in your user profile. Be careful not to choose a keyboard combination already used by your browser!

Close the palette with Escape, clicking outside of it, or pressing Ctrl/Cmd-Alt-Shift-P (or your custom key combination) again.

Hover over the snail in the admin bar for a reminder of your shortcut at any time.

You can:

- type to filter the commands
- use up and down arrows to select an item
- press enter to select an item
- hit escape (not too hard) to close the palette

You can also select items with your mouse/trackpad.

If you hold Ctrl/Cmd when selecting an item it will open in a new tab/window (you may need to allow your browser to open popups).

## Search modes

As well as commands, the plugin can also search content that is made available through the REST API (as long as the REST API can be discovered).

This is done using "search modes".

For example, if you type "post" and then press the tab key (or type a colon) you will switch to the "post" search mode. In this mode you are searching for posts.

Turbo Admin automatically creates search modes for any public post types on your site. It also creates the following search modes:

* user
* plugin
* site (for WordPress Multisite sites)

There is full documentation of search modes on [the Turbo Admin website](https://turbo-admin.com/searching.html)

## Admin bar search mode

The command palette is pop-up/modal by default. But if you forget it's there then you can opt to have the command palette as an always-displayed search box in the admin bar.

To use this mode, visit your user profile, find the "Turbo Admin settings" section and check the "Admin bar search" option. Be sure to click "Update Profile" to save the change.

## Barkeeper

The "Barkeeper" hides away non-critical admin-bar items in a slide-out panel. Click the arrow to toggle the panel open and closed.

The Barkeeper keeps a few items that I've deemed as critical, such as the site name and the updates icon/notification.

To enable the Barkeeper feature, visit your user profile, find the "Turbo Admin settings" section and check the "Barkeeper" option. Be sure to click "Update Profile" to save the change.

This feature pairs really well with the admin bar search mode, freeing up space for the admin-bar search box.

## Using the (experimental) Notice Hiding feature

Notice hiding lets you move unwanted notices into a separate panel at the top-right of the dashboard.

To turn on the Notice Hiding feature, visit your user profile, find the "Turbo Admin settings" section, and check the feature in the "Additional features" section. Be sure to click "Update Profile" to save the change.

I have attempted to be somewhat "intelligent" in how I hide notices, automatically handling obvious cases, and giving you choice in other cases.

This is why this feature is flagged as "Experimental" - I may not have the "intelligence" right just yet.

[Read more about Turbo Admin's Notice Hiding](https://turbo-admin.com/hide-notices.html)

The "Notices" tab in the top-right will show a red-circled number if there are notices to see.

If Turbo Admin gives you the option of hiding a notice it will have a "Move to panel" button. Click this to move it to the panel. You can always move it back if you change your mind.

## Using the (experimental) List Table Keyboard Shortcuts feature

This feature is documented on [the Turbo Admin website](https://turbo-admin.com/list-table-keys.html)

To turn on the List Table Keyboard Shortcuts feature, visit your user profile, find the "Turbo Admin settings" section, and check the feature in the "Additional features" section. Be sure to click "Update Profile" to save the change.

== Frequently Asked Questions ==

= Commands aren't showing on the front end of the site. =

You need to be logged in for Turbo Admin to work.

Commands are scraped from the menus on the WP Admin side and cached for use on the front end so if the palette is showing but with no commands you'll need to visit the Dashboard to get the menu cached.

= Content search isn't working. =

This could be for several reasons, but it's dependent on the REST API being discoverable and the content you want to search being available in the API.

It's known to not work in ClassicPress, when some security plugins hide the API's discovery, or when the API routes have been changed from the defaults.

= Can I hide the icon in the admin bar? =

Yes, as of v1.5.3 there is an option to do this in each user's profile.

If you want to hide the icon for all users, or based or their role or something
then you can use the `turbo_admin_hide_icon_default` filter. This filter should:

* Return 0 to show the icon
* Return 1 to hide the icon

This filter is a default and is overridden by the user's setting.

`
// Hide icon by default for everyone
add_filter('turbo_admin_hide_icon_default', 'ta_hide_icon', 10, 2);
function ta_hide_icon($hide, $user_id) {
    return 1;
}
`

= Do I really have to install this on EVERY site? =

It's funny you ask. There's also a [browser extension](https://turbo-admin.com) that will let you have Turbo Admin on every wp-admin without having to install anything!

== Installation ==

The easiest way to install this is to:

1. Search for it on the plugin directory
2. Install it
3. Activate it

If you're reading this then you've probably already done step 1. So what are you waiting for?

== Screenshots ==

1. The command palette in action
2. Settings in the user profile page

== Changelog ==

= 1.13.3 =

* [ENHANCEMENT] Add search modes to the command palette - I'm not sure if I like this or not
* [FIX] Bug that prevented Turbo Admin starting up in Firefox. Sorry about that! Props @saschinger and @mrwweb for reporting.

= 1.13.2 =

* [ENHANCEMENT] Storage abstraction enhancements
* [ENHANCEMENT] Improved notice handling (again!)
* [FIX] Save Barkeeper state properly
* [FIX] Content API now uses the storage abstraction to work on both plugin and extension.

= 1.13.1 =

This version was skipped in the plugin.

* Version bump for publishing the Firefox extension

= 1.13.0 =

This version was skipped in the plugin.

* [ENHANCEMENT] Some code rewrites because the extension now uses "Manifest v3" which is a new extension format. Hopefully nothing is broken but PLEASE report any issues.
* [ENHANCEMENT] Speed improvements in some situations (cache post types collected from the API).
* [ENHANCEMENT] Improvements to list-table keys (more list-table key nav improvements coming).
* [ENHANCEMENT] Other behind-the-scenes improvements and preparations for other new features.
* [ENHANCEMENT] Add debug mode and suppress most errors if it's turned off.
* [FIX] Fix for WP 6.2 site editor interface (props Courtney Robertson)


= 1.12.1 =
* Version bump for publishing

= 1.12.0 =
* [FEATURE] Search modes
* [FEATURE] User search
* [FEATURE] Plugin search
* [ENHANCEMENT] Command palette core re-written to be faster, more reliable and more extensible.

= 1.9.0 =
* [FEATURE] Admin bar search mode
* [FEATURE] Barkeeper
* [ENHANCEMENT] Better post type detection in the command palette
* [FIX] Notice hiding didn't work! Fixed.

= 1.7.0 =
* [FEATURE] Re-designed notice hiding (still experimental)
* [FEATURE] List table keyboard shortcuts (experimental/alpha)
* [FEATURE] Oxygen builder support in the command palette
* [ENHANCEMENT] MUCH improved content search with better debouncing and caching
* [ENHANCEMENT] Improved palette startup time

= 1.6.0 =
* Note: The plugin version skipped this release
* [FEATURE] Notice hiding (experimental)

= 1.5.3 =
* Allow icon in admin bar to be hidden

= 1.5.2 =
* Proper bugfix - content search now works on front-end!

= 1.5.1 =
* Temporary bugfix - proper fix coming soon.

= 1.5.0 =
* Content search using REST API (where available and discoverable)
* Disable full-screen block editor mode (only applies to browser extension)
* Automatically dismiss block editor welcome screen (only applies to browser extension)

= 1.0.4 =
* Allow meta-click to open in new tab and improve mouse clicking
* Improved styles
* Initial go at caching commands for front-end
* Improved login URL detection (only applies to browser extension)

= 1.0.3 =
* Some multisite support!!
* Palette is now sorted alphabetically rather then by order items were discovered in the DOM
* Slightly better search results and item-focussing rules
* Add items to the palette, including some from the Toolbar, such as "Logout", "View post", "Edit post", "Customize", and all the "New..." items.
* Internal refactoring
* Remove debugging

= 1.0.2 =
* Really... I will!
* Previously: User can now select keyboard shortcut to use

= 1.0.1 =
* Bump main version number
* I'll get good at plugin releases one day!
* Previously: User can now select keyboard shortcut to use

= 1.0.0 =
* User can now select keyboard shortcut to use

= 0.1.5 =
* Shortcut keys will now close the palette as well as open it
* Clicking outside the palette will close it
* More prominent usage instructions
* Detect existing Turbo Admin palette
* Allow to run on front-end with limited capability

= 0.1.4 =
* Fix overlay
* Remove debugging

= 0.1.3 =
* Ignore unwanted files in distribution

= 0.1.2 =
* Ignore unwanted files in distribution

= 0.1.1 =
* Fix plugin repo assets

= 0.1.0 =
* Initial release
