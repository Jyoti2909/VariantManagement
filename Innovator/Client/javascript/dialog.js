//simple logic common for all Innovator dialogs
(function () {
	var dialogArguments =
		window.dialogArguments ||
		(window.frameElement && window.frameElement.dialogArguments);
	var DIALOG_WINDOW = window.DIALOG_WINDOW || {};

	DIALOG_WINDOW.registerDialogShortcuts = function (
		aWindow,
		registerChildFrames
	) {
		// loadShortcutsFromCommandBarsAsync - should be called only if user login was finished.
		if (
			dialogArguments &&
			dialogArguments.aras &&
			dialogArguments.aras.getCurrentUserID()
		) {
			var topWindow = dialogArguments.aras.getMostTopWindowWithAras(window);
			if (topWindow.cui) {
				var loadParams = {
					locationName: 'DialogShortcuts',
					item_classification: '%all_grouped_by_classification%'
				};
				var settings = {
					windows: [aWindow],
					context: aWindow,
					registerChildFrames: registerChildFrames
				};
				topWindow.cui.loadShortcutsFromCommandBarsAsync(loadParams, settings);
			}
		}
	};

	if (dialogArguments && !dialogArguments.ignoreDialogShortcuts) {
		window.addEventListener(
			'load',
			function () {
				DIALOG_WINDOW.registerDialogShortcuts(this);
			},
			false
		);
	}

	window.DIALOG_WINDOW = DIALOG_WINDOW;
})();
