/*global window, ITEM_WINDOW*/
(function () {
	'use strict';
	var ITEM_WINDOW = window.ITEM_WINDOW || {};

	/**
	 * Register shortcuts
	 *
	 * @param {Window} aWindow - window for registration
	 */
	ITEM_WINDOW.registerStandardShortcuts = function (
		aWindow,
		registerChildFrames,
		skipShortcutsUnload
	) {
		var topWindow = aras.getMostTopWindowWithAras(window);
		var loadParams = {
			locationName: 'ItemWindowShortcuts',
			item_classification: '%all_grouped_by_classification%'
		};
		var settings = {
			windows: [aWindow],
			context: aWindow,
			registerChildFrames: registerChildFrames,
			skipShortcutsUnload: skipShortcutsUnload
		};
		topWindow.cui.loadShortcutsFromCommandBarsAsync(loadParams, settings);
	};

	ITEM_WINDOW.registerCtrlSRelationshipShortcut = function (
		aWindow,
		registerChildFrames,
		shortcuts
	) {
		shortcuts = shortcuts || Object.keys(callbackHandlers);
		var index = 0;
		var shortcut;
		for (index; index < shortcuts.length; index += 1) {
			shortcut = shortcuts[index].toLowerCase();
			if (callbackHandlers[shortcut]) {
				aras.shortcutsHelperFactory.getInstance(aWindow).subscribe(
					{
						shortcut: shortcut,
						handler: callbackHandlers[shortcut],
						context: aWindow
					},
					registerChildFrames
				);
			}
		}
	};

	window.addEventListener(
		'load',
		function () {
			ITEM_WINDOW.registerStandardShortcuts(this);
		},
		false
	);
	window.ITEM_WINDOW = ITEM_WINDOW;
})();
