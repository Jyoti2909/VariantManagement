// jshint ignore:line
/*global KeyboardEvent, window*/
(function () {
	'use strict';
	var ShortcutListener = function (shortcut) {
		this.callbacks = [];
		this.shortcut = shortcut;
	};

	ShortcutListener.prototype.addCallback = function (callback) {
		this.callbacks.push(callback);
	};

	ShortcutListener.prototype.removeCallback = function (callback) {
		this.callbacks = this.callbacks.filter(function (item) {
			if (item === callback) {
				return false;
			}
			return true;
		});
	};

	ShortcutListener.prototype.preventBlur = function () {
		return !this.callbacks.some(function (item) {
			return true !== item.preventBlur;
		});
	};

	ShortcutListener.prototype.stopPropagation = function () {
		return !this.callbacks.some(function (item) {
			return true !== item.stopPropagation;
		});
	};

	ShortcutListener.prototype.preventDefault = function () {
		return this.callbacks.some(function (item) {
			return false !== item.preventDefault;
		});
	};

	ShortcutListener.prototype.callback = function (state) {
		var callback;
		var callbackResult;
		var index = 0;
		for (index; index < this.callbacks.length; index += 1) {
			callback = this.callbacks[index];
			if (callback.hasOwnProperty('enabled') && !callback.enabled) {
				continue;
			}
			if (state.useCapture === callback.useCapture) {
				callbackResult = callback.context
					? callback.handler.call(callback.context, state)
					: callback.handler(state);
				if (!callbackResult) {
					return false;
				}
			}
		}
		return true;
	};

	var specialKeys = {
		8: 'backspace',
		9: 'tab',
		13: 'enter',
		19: 'pause',
		20: 'capslock',
		27: 'esc',
		32: 'space',
		33: 'pageup',
		34: 'pagedown',
		35: 'end',
		36: 'home',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		45: 'insert',
		46: 'delete',
		96: '0',
		97: '1',
		98: '2',
		99: '3',
		100: '4',
		101: '5',
		102: '6',
		103: '7',
		104: '8',
		105: '9',
		106: '*',
		107: '+', // '+' from Num keyboard
		109: '-', // '-' from Num keyboard
		110: '.',
		111: '/',
		112: 'f1',
		113: 'f2',
		114: 'f3',
		115: 'f4',
		116: 'f5',
		117: 'f6',
		118: 'f7',
		119: 'f8',
		120: 'f9',
		121: 'f10',
		122: 'f11',
		123: 'f12',
		144: 'numlock',
		145: 'scroll',
		187: '+',
		188: '<',
		189: '-',
		190: '>',
		191: '/',
		192: '~',
		219: '[',
		221: ']'
	};

	var modifierKeys = {
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		224: 'meta',
		91: 'windows'
	};

	var shiftNums = {
		'`': '~',
		'1': '!',
		'2': '@',
		'3': '#',
		'4': '$',
		'5': '%',
		'6': '^',
		'7': '&',
		'8': '*',
		'9': '(',
		'0': ')',
		'-': '_',
		'=': '+',
		';': ': ',
		"'": '"',
		',': '<',
		'.': '>',
		'/': '?',
		'\\': '|'
	};

	var parseEvent = function (event) {
		var character =
			specialKeys[event.which] ||
			String.fromCharCode(event.which).toLowerCase();
		var modif = '';
		var shortcuts = [];
		// check combinations (alt|ctrl|shift+anything)
		if (event.altKey) {
			modif += 'alt+';
		}

		if (event.ctrlKey && aras.Browser.OSName !== 'MacOS') {
			modif += 'ctrl+';
		}

		// TODO: Need to make sure this works consistently across platforms
		if (event.metaKey && !event.ctrlKey) {
			//equate pressing meta to ctrl
			modif += 'ctrl+';
		}

		if (event.shiftKey) {
			modif += 'shift+';
		}

		shortcuts.push(modif + character);
		// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
		if ('shift+' === modif) {
			shortcuts.push(modif + shiftNums[character]);
			shortcuts.push(shiftNums[character]);
		}
		return shortcuts;
	};

	var ShortcutsHelper = function (aWindow) {
		var shortcutListeners = {};
		var isPreventDefault = false;
		var preventDefaultHandler = function (event) {
			if (isPreventDefault) {
				event.preventDefault();
				isPreventDefault = false;
			}
		};

		var getAvailableShortcuts = function (possibleShortcuts) {
			var signedShorcuts = Object.keys(shortcutListeners);
			return possibleShortcuts.filter(function (item) {
				if (-1 === signedShorcuts.indexOf(item)) {
					return false;
				}
				return true;
			});
		};

		var eventHandler = function (event, useCapture) {
			if (modifierKeys[event.which]) {
				return;
			}

			var possibleShortcuts = parseEvent(event);
			var activeElement = event.currentTarget.document.activeElement;
			var availableShortcuts = getAvailableShortcuts(possibleShortcuts);

			if (0 === availableShortcuts.length) {
				return;
			}
			var preventBlur = false;
			var preventDefault = true;
			var stopPropagation = false;
			var index = 0;
			var shortcutListener;
			var tmp;
			for (index; index < availableShortcuts.length; index += 1) {
				shortcutListener = shortcutListeners[availableShortcuts[index]];
				tmp = shortcutListener.preventBlur();
				if (tmp && !preventBlur) {
					preventBlur = true;
				}
				tmp = shortcutListener.preventDefault();
				if (!tmp && preventDefault) {
					preventDefault = false;
				}
				tmp = shortcutListener.stopPropagation();
				if (tmp && !stopPropagation) {
					stopPropagation = true;
				}
			}

			if (preventDefault) {
				event.preventDefault();
			}

			if (stopPropagation) {
				event.stopPropagation();
			}

			var shortcutState = {
				contentBlurable:
					activeElement &&
					['INPUT', 'SELECT', 'TEXTAREA'].indexOf(activeElement.tagName) !== -1,
				contentEditable:
					activeElement &&
					(activeElement.tagName === 'INPUT'
						? ['text', 'password'].indexOf(activeElement.type.toLowerCase()) !==
						  -1
						: 'TEXTAREA' === activeElement.tagName
						? true
						: false),
				useCapture: useCapture
			};
			//if an domNode has the focus then call  method  blur event to trigger
			//onchange event (the change event is fired for <input>, <select>, and <textarea> elements)
			if (!preventBlur && shortcutState.contentBlurable) {
				activeElement.blur();
			}

			//fix bug related on running setTimeout with function from other window in IE10
			var context = {
				availableShortcuts: availableShortcuts,
				shortcutListeners: shortcutListeners,
				shortcutState: shortcutState
			};
			event.currentTarget.setTimeout(
				event.currentTarget
					.Function(
						'var shortcut,\n' +
							'	sortcutListener,\n' +
							'	index = 0;\n' +
							'for (index; index < this.availableShortcuts.length; index += 1) {\n' +
							'	sortcutListener = this.shortcutListeners[this.availableShortcuts[index]];\n' +
							'	sortcutListener.callback(this.shortcutState);\n' +
							'}\n'
					)
					.bind(context),
				0
			);
		};

		var eventHandlerWithoutCapture = function (e) {
			eventHandler(e, false);
		};

		var eventHandlerWithCapture = function (e) {
			eventHandler(e, true);
		};

		//subscribe to keydown event
		aWindow.addEventListener('keypress', preventDefaultHandler, false);
		aWindow.addEventListener('keydown', eventHandlerWithoutCapture, false);
		aWindow.addEventListener('keydown', eventHandlerWithCapture, true);

		this.subscribe = function (callback, subcribeChild) {
			var shortcut = callback.shortcut.toLowerCase();
			if (undefined === callback.useCapture) {
				callback.useCapture = false;
			}
			if (!shortcutListeners[shortcut]) {
				shortcutListeners[shortcut] = new ShortcutListener(shortcut);
			}
			shortcutListeners[shortcut].addCallback(callback);
			if (subcribeChild) {
				var frames = aWindow.document.querySelectorAll('frame, iframe');
				var factory = new window.ShortcutsHelperFactory();
				var index = 0;
				var currFrame;
				var frameLoadHandler = function () {
					factory
						.getInstance(this.contentWindow)
						.subscribe(callback, subcribeChild);
				};
				for (index; index < frames.length; index += 1) {
					currFrame = frames[index];
					currFrame.addEventListener('load', frameLoadHandler, false);
					(function (currFrame) {
						// jshint ignore:line
						var windowUnloadHandler = function () {
							currFrame.removeEventListener('load', frameLoadHandler);
							this.removeEventListener('unload', windowUnloadHandler);
						};
						aWindow.addEventListener('unload', windowUnloadHandler, false);
					})(currFrame); // jshint ignore:line
					try {
						var tmp = currFrame.contentDocument;
					} catch (ex) {
						return; //"no such interface supported" for "xDomain" in frames
					}
					if (
						currFrame.contentDocument &&
						'complete' === currFrame.contentDocument.readyState
					) {
						frameLoadHandler.call(currFrame);
					}
				}
			}
		};

		this.unsubscribe = function (callback, unsubcribeChild) {
			var shortcutListener = shortcutListeners[callback.shortcut.toLowerCase()];
			if (shortcutListener) {
				shortcutListener.removeCallback(callback);
			}
			if (unsubcribeChild) {
				var frames = aWindow.document.querySelectorAll('frame, iframe');
				var factory = new window.ShortcutsHelperFactory();
				var index = 0;
				var currFrame;
				for (index; index < frames.length; index += 1) {
					currFrame = frames[index];
					factory
						.getInstance(currFrame.contentWindow)
						.unsubscribe(callback, unsubcribeChild);
				}
			}
		};

		this.unsubscribeWindow = function (aWindow) {
			var listener;
			var callback;
			for (var sIndex in shortcutListeners) {
				listener = shortcutListeners[sIndex];
				if (listener.callbacks) {
					for (var lIndex = 0; lIndex < listener.callbacks.length; lIndex++) {
						callback = listener.callbacks[lIndex];
						if (callback.context == aWindow) {
							this.unsubscribe(callback);
						}
					}
				}
			}
		};

		this.dispose = function () {
			aWindow.removeEventListener('keypress', preventDefaultHandler);
			aWindow.removeEventListener('keydown', eventHandlerWithoutCapture);
			aWindow.removeEventListener('keydown', eventHandlerWithCapture);
		};
	};

	window.ShortcutsHelperFactory = function () {};

	window.ShortcutsHelperFactory.prototype.getInstance = function (aWindow) {
		if (
			!aWindow.ARAS_SHORTCUTS_HELPER ||
			!(aWindow.ARAS_SHORTCUTS_HELPER instanceof ShortcutsHelper)
		) {
			aWindow.ARAS_SHORTCUTS_HELPER = new ShortcutsHelper(aWindow);
			var unsibscribeHandler = function () {
				aWindow.removeEventListener('unload', unsibscribeHandler);
				aWindow.ARAS_SHORTCUTS_HELPER.unsubscribeWindow(aWindow);
				aWindow.ARAS_SHORTCUTS_HELPER.dispose();
			};

			aWindow.addEventListener('unload', unsibscribeHandler);
		}
		return aWindow.ARAS_SHORTCUTS_HELPER;
	};
})();
