var PageReturnBlocker = function () {
	this.completeFlag = 'reloadShortcutsBlocked';
	this.loaderFlag = 'blockerLoaderAttached';
	this.skipFlag = 'skipReloadShortcutsBlocker';
	this.manualStartAttribute = 'startBlockerManually';
	return this;
};

// for current window, prevent default browser behavior for backspace( load previous page ), F5 ( reload current page)
PageReturnBlocker.prototype.attachReloadShortcutsBlocker = function (
	targetWindow
) {
	if (
		targetWindow &&
		!targetWindow[this.completeFlag] &&
		!targetWindow[this.skipFlag]
	) {
		const shortcutsBlockHandler = function (evt) {
			const eventCode = evt.code;
			let preventRequired = false;

			switch (eventCode) {
				case 'Backspace': //backspace shortcut for Firefox only
					const targetElement = evt.target;
					const targetElementName = targetElement.tagName;

					if (
						'input'.toUpperCase() !== targetElementName &&
						'textarea'.toUpperCase() !== targetElementName
					) {
						if (
							targetWindow.document.hasOwnProperty('isEditMode') &&
							!targetWindow.document.isEditMode
						) {
							preventRequired = true;
						} else {
							preventRequired = !(
								targetElement.contentEditable === 'true' ||
								targetElement.ownerDocument.designMode === 'on'
							);
						}
					}
					break;
				case 'F5':
					preventRequired = true;
			}

			if (preventRequired) {
				evt.preventDefault();
			}
		};

		targetWindow.document.addEventListener(
			'keydown',
			shortcutsBlockHandler,
			false
		);
		targetWindow[this.completeFlag] = true;
	}
};

PageReturnBlocker.prototype.blockInChildFrames = function (
	targetWindow,
	blockInChilds
) {
	if (targetWindow) {
		var frames = targetWindow.document.querySelectorAll('frame, iframe');
		var currentFrame = null;
		var self = this;

		for (var index = 0; index < frames.length; index++) {
			currentFrame = frames[index];
			if (!currentFrame[this.loaderFlag]) {
				/* jshint -W083 */
				(function (currentFrame) {
					var pageLoadHandler = function () {
						self.attachBlocker(currentFrame.contentWindow, blockInChilds);
					};
					var pageUnloadHandler = function () {
						currentFrame.removeEventListener('load', pageLoadHandler);
						targetWindow.removeEventListener('unload', pageUnloadHandler);
					};
					currentFrame.addEventListener('load', pageLoadHandler, false);
					targetWindow.addEventListener('unload', pageUnloadHandler, false);
				})(currentFrame);
				/* jshint +W083 */

				this.attachBlocker(currentFrame.contentWindow, blockInChilds);
				currentFrame[this.loaderFlag] = true;
			}
		}
	}
};

PageReturnBlocker.prototype.attachBlocker = function (
	targetWindow,
	blockInChilds
) {
	targetWindow = targetWindow ? targetWindow : window;

	try {
		var doc = targetWindow.document;
	} catch (exe) {
		return; //access denied
	}
	this.attachReloadShortcutsBlocker(targetWindow);

	if (blockInChilds) {
		var documentState = targetWindow.document.readyState;
		if (documentState === 'complete' || documentState === 'interactive') {
			this.blockInChildFrames(targetWindow, true);
		} else {
			var self = this;
			var DOMContentLoadedHandler = function () {
				self.blockInChildFrames(targetWindow, true);
				this.removeEventListener('DOMContentLoaded', DOMContentLoadedHandler);
			};

			targetWindow.document.addEventListener(
				'DOMContentLoaded',
				DOMContentLoadedHandler,
				false
			);
		}
	}
};

// add returnBlocker object to window
var returnBlockerHelper = new PageReturnBlocker();

(function () {
	var blockerScript = null;
	var pageScripts = document.getElementsByTagName('script');
	var scriptSrc = '';

	for (var i = 0; i < pageScripts.length; i++) {
		scriptSrc = pageScripts[i].src.toUpperCase();

		if (scriptSrc.indexOf('PAGERETURNBLOCKER') > -1) {
			blockerScript = pageScripts[i];
			break;
		}
	}

	var startManual = blockerScript.getAttribute(
		returnBlockerHelper.manualStartAttribute
	);
	if (startManual != 'true') {
		window.document.addEventListener(
			'DOMContentLoaded',
			function () {
				returnBlockerHelper.attachBlocker(null, true);
			},
			false
		);
	}
})();
