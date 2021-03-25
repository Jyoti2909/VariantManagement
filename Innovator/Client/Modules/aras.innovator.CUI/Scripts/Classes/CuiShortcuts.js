var CuiShortcuts = (function () {
	function CuiShortcuts() {
		//'private' object must be created at ConfigurableUI module.
		//If CuiShortcuts module is used separately from ConfigurableUI module, 'private' object should be created in CuiShortcuts constructor
		if (!this.private) {
			var self = this;
			this.private = {
				declare: function (fieldName, func) {
					var boundFunc = func.bind(self);
					this[fieldName] = boundFunc;
				}
			};
		}

		this.private.declare('loadShortcutsImplementation', function (
			loadParams,
			settings,
			async
		) {
			if (settings.windows) {
				loadParams = Object.assign(
					this.utils.getDefaultContextItem(),
					loadParams
				);
				return this.dataLoader
					.loadCommandBarImplementation(
						loadParams.locationName,
						loadParams,
						async
					)
					.then(
						function (items) {
							// There is need to unsubscribe all shortcuts. It's necessary because shortcuts should load per itemtype.
							// Each itemtype can have own shortcuts sequence.
							// 'skipShortcutsUnload' is a special flag that prevent unloading shortcuts from context defined in settings.
							// For example: Tear-Off window with relationships grid. Shortcuts are registred at same context but for different Loactions:
							// 'ItemWindowRelationshipsShortcuts' and 'ItemWindowShortcuts' (please look at Relationships.js 'registerShortcuts' method)
							// 'skipShortcutsUnload' is 'undefined' by default.
							if (!settings.skipShortcutsUnload) {
								this.unloadShortcuts(settings);
							}

							for (var i = 0; i < items.length; i++) {
								var currentItem = items[i];
								var handler = this._getShortcutHandler(currentItem);
								var shortcut = currentItem.selectSingleNode('shortcut');
								shortcut = shortcut ? shortcut.text : '';
								if (handler) {
									var shortcutCallback = {
										handler: handler,
										shortcut: shortcut
									};
									var initMethodName = this.utils.getOnInitHandlerName(
										currentItem
									);
									var initData = null;
									if (initMethodName) {
										initData = this.utils.evalCommandBarItemMethod(
											initMethodName,
											loadParams
										);
									}

									var additionalData = this.utils.getCommandBarItemAdditionalData(
										currentItem,
										initData
									);
									if (additionalData) {
										Object.assign(shortcutCallback, additionalData);
									}

									for (var j = 0; j < settings.windows.length; j++) {
										shortcutCallback.context = settings.context;
										aras.shortcutsHelperFactory
											.getInstance(settings.windows[j])
											.subscribe(
												shortcutCallback,
												settings.registerChildFrames
											);
									}
								}
							}
						}.bind(this)
					);
			}
		});
	}

	CuiShortcuts.prototype._getShortcutHandler = function (item) {
		var methodId = item.selectSingleNode('on_click_handler');
		methodId = methodId ? methodId.text : '';
		var evalShortcutHandler = function evalevalShortcutHandler(state) {
			var methodNd = aras.MetadataCache.GetClientMethodNd(methodId, 'id');
			if (methodNd) {
				var methodCode = methodNd.selectSingleNode('method_code');
				if (methodCode) {
					/* jshint ignore:start */
					var newFunc = new Function('state', methodCode.text);
					/* jshint ignore:end */
					return newFunc.call(this, state);
				}
			}
			return;
		};

		return methodId ? evalShortcutHandler : null;
	};

	CuiShortcuts.prototype.loadShortcutsFromCommandBars = function (
		loadParams,
		settings
	) {
		this.private.loadShortcutsImplementation(loadParams, settings, false);
	};

	CuiShortcuts.prototype.loadShortcutsFromCommandBarsAsync = function (
		loadParams,
		settings
	) {
		return this.private.loadShortcutsImplementation(loadParams, settings, true);
	};

	CuiShortcuts.prototype.unloadShortcuts = function (settings) {
		for (var i = 0; i < settings.windows.length; i++) {
			var currentWindow = settings.windows[i];
			var scHelper = aras.shortcutsHelperFactory.getInstance(currentWindow);
			scHelper.unsubscribeWindow(settings.context);
		}
	};

	return CuiShortcuts;
})();
