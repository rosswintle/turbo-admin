=== Turbo Admin ===
Contributors: magicroundabout
Donate link: https://ko-fi.com/magicroundabout
Tags: menu, commands, shortcuts
Requires at least: 4.9
Tested up to: 5.8
Requires PHP: 7.2
Stable tag: 1.5.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The command palette that gives super fast access to your WordPress Dashboard.

If you love this plugin, you can get Turbo Admin on ALL your sites, without needing to install the plugin, with the browser extension version!

[Check out the Browser Extension](https://turbo-admin.com/)

== Description ==

## Usage

Install, activate and then:

* Windows: Ctrl-Alt-Shift-P (Linux also?)
* Mac: Cmd-Alt-Shift-P

You can customise the keyboard combination used in the settings in your user profile. Be careful not to choose a keyboard combination already used by your browser.

Close the palette with Escape, clicking outside of it, or pressing Ctrl/Cmd-Alt-Shift-P (or your custom key combination) again.

Hover over the snail in the admin bar for a reminder of your shortcut at any time.

## Turbo Admin: The command palette that gives super fast access to your WordPress Dashboard.

Ugh, this Dashboard menu is so cluttered?

Where is everything?

Is it in Tools? Or Settings? Or some menu of it's own?

How am I supposed to work with this clutter?

## If the WordPress Dashboard is slowing you down, Turbo Admin is here to speed you up.

A customisable key-combination launches a command palette with all your menu items.

Fuzzy search helps you find items even when you're not sure what they are called.

If you've used Alfred App or Spotlight or the command palette in your text editor or IDE, you'll know the benefits of a tool like this and you'll quickly feel at home.

Install... activate... work faster!

## How does it work?

Install the plugin and activate it and then press Ctrl-Alt-Shift-P (or Cmd-Alt-Shift-P on a Mac) to open the palette.

The keyboard shortcut can be customised from settings in your user profile. Be careful not to choose a keyboard combination already used by your browser.

You can:
 - type to filter the commands
 - use up and down arrows to select an item
 - press enter to select an item
 - hit escape (not too hard) to close the palette

You can also select items with your mouse/trackpad.

If you hold Ctrl/Cmd when selecting an item it will open in a new tab/window (you may need to allow your browser to open popups).

As well as commands, the plugin will also search content that is made available through the REST API (as long as the REST API can be discovered).

## Commands aren't showing on the front end of the site.

You need to be logged in for Turbo Admin to work.

Commands are scraped from the menus on the WP Admin side and cached for use on the front end so if the palette is showing but with no commands you'll need to visit the Dashboard to get the menu cached.

## Content search isn't working.

This could be for several reasons, but it's dependent on the REST API being discoverable and the content you want to search being available in the API.

It's known to not work in ClassicPress, when some security plugins hide the API's discovery, or when the API routes have been changed from the defaults.

## Can I hide the icon in the admin bar?

Yes, as of v1.5.3 there is an option to do this in each user's profile.

If you want to hide the icon for all users, or based or their role or something
then you can use the `turbo_admin_hide_icon_default` filter. This filter should:

* Return 0 to show the icon
* Return 1 to hide the icon

This filter is a default and is overridden by the user's setting.

```
// Hide icon by default for everyone
add_filter('turbo_admin_hide_icon_default', 'ta_hide_icon', 10, 2);
function ta_hide_icon($hide, $user_id) {
    return 1;
}
```

## Do I really have to install this on EVERY site?

It's funny you ask. There's also a (paid-for) [browser extension](https://turbo-admin.com) that will let you have Turbo Admin on every wp-admin without having to install anything!

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
