function RelationshipsControlWrapper(args) {
	this.activeFrames = new Set();
	this.aras = args.aras;
	this.args = args;
	this.frames = new Set();
	this.iframesCollection = {};
	this.itemId = args.queryString.itemID;
	this.itemTypeName = args.queryString.ITName;
	this.isEditMode = args.queryString.editMode;
	this.loadPromise = new Promise(
		function (resolve) {
			this._resolveOnloadPromise = resolve;
		}.bind(this)
	);

	this._initItem();
}

RelationshipsControlWrapper.prototype = {
	getFirstEnabledTabID: function (ignoreParamTab) {
		const result = this._fireOverriddenFunction('getFirstEnabledTabID', [
			ignoreParamTab
		]);
		if (result !== undefined) {
			return result;
		}

		const tabComponent = this.relTabbar.tabs;
		return (
			tabComponent.tabs.find(function (tabId) {
				const tabData = tabComponent.data.get(tabId);
				return (
					tabData &&
					!tabData.disabled &&
					!tabData.hidden &&
					!(ignoreParamTab && tabId === 'Parameters')
				);
			}) || ''
		);
	},

	loadRelationshipFrame: function (relTabId, frame, previousFrame) {
		const result = this._fireOverriddenFunction('onTab', [relTabId]);
		if (result !== undefined) {
			return result;
		}

		if (!frame) {
			this._unloadFrame(previousFrame);
			return;
		}

		this._loadFrame(relTabId, frame, previousFrame);
	},

	reload: function (queryString) {
		this.args.queryString = queryString;
		this.isEditMode = queryString.editMode === 1;
		this.itemTypeName = queryString.ITName;
		this.itemId = queryString.itemID;
		const prevActiveFrames = Array.from(this.activeFrames);

		this.activeFrames.clear();
		this._initItem();
		this._initIframesCollection();

		const isParamTabVisible = this.aras.uiIsParamTabVisible(this.item);
		this.relTabbar.setTabVisible('Parameters', isParamTabVisible);
		prevActiveFrames.forEach(function (frame) {
			this.loadRelationshipFrame(frame.id, frame);
		}, this);
	},

	setEditMode: function (updatedItem) {
		this._setNewMode('setEditMode', updatedItem);
	},

	setViewMode: function (updatedItem) {
		this._setNewMode('setViewMode', updatedItem);
	},

	updateTabbarState: function () {},

	_initIframesCollection: function (currentIframeId) {
		const result = this._fireOverriddenFunction('initIframesCollection', [
			currentIframeId
		]);
		if (result !== undefined) {
			return result;
		}

		this.frames.forEach(function (frame) {
			if (!this.activeFrames.has(frame)) {
				frame.src = 'about:blank';
				this.frames.delete(frame);
				delete this.iframesCollection[frame.id];
			}
		}, this);
	},

	_fireOverriddenFunction: function (functionName, argumentsArray) {
		const parent = this.args.window;
		const overriddenFunctions = parent.RelationshipsOverriddenFunctions || {};
		if (overriddenFunctions[functionName]) {
			return overriddenFunctions[functionName].apply(this, argumentsArray);
		}
	},

	_getIFrameSrc: function (tabId) {
		const result = this._fireOverriddenFunction('getIFrameSrc', [tabId]);
		if (result !== undefined) {
			return result;
		}

		const settings = this.args.queryString;
		const defaultParams = {
			db: settings.db,
			ITName: settings.ITName,
			itemID: settings.itemID,
			relTypeID: tabId,
			editMode: this.isEditMode ? 1 : 0,
			toolbar: settings.toolbar,
			where: settings.where
		};
		const queryParams = new URLSearchParams();
		if (tabId === 'Parameters') {
			this._setQueryParams(queryParams, defaultParams);
			window.LocationSearches[tabId] = '?' + queryParams.toString();
			return 'parametersGrid.html';
		}

		const relationshipItemType = this.aras.getRelationshipType(tabId);
		if (!relationshipItemType) {
			return 'blank.html';
		}

		const relationshipView = this.aras.uiGetRelationshipView4ItemTypeEx(
			relationshipItemType.node
		);
		if (relationshipView) {
			const form = this.aras.getItemProperty(relationshipView, 'form');
			if (form) {
				const formType = this.isEditMode ? 'edit' : 'view';
				this._setQueryParams(queryParams, { formId: form, formType: formType });
				window.LocationSearches[tabId] = '?' + queryParams.toString();
				return 'ShowFormInFrame.html';
			}

			const grid = this.aras.getItemProperty(relationshipView, 'grid');
			if (grid) {
				return 'ConfigurableGrid.html?grid=' + grid;
			}
		}

		const relationshipParams = Object.assign(
			{ arasCacheControl: 'NoCache', WorkFlowProc: settings.WorkFlowProc },
			defaultParams
		);
		return this._getRelationshipUrl(
			relationshipView,
			queryParams,
			relationshipParams
		);
	},

	_getRelationshipsGridUrl: function () {
		return this.aras.getScriptsURL() + 'relationshipsInfernoGrid.html';
	},

	_getRelationshipUrl: function (relationshipView, queryParams, defaultParams) {
		const viewUrl = this.aras.getItemProperty(relationshipView, 'start_page');
		const viewParams = this.aras.getItemProperty(
			relationshipView,
			'parameters'
		);
		const url = viewUrl || this._getRelationshipsGridUrl();

		let params;
		if (viewParams) {
			params = this._replaceViewParameters(viewParams, defaultParams);
		} else {
			this._setQueryParams(queryParams, defaultParams);
			params = queryParams.toString();
		}

		if (relationshipView) {
			return url + '?' + params;
		}

		const relTypeId = queryParams.get('relTypeID');
		window.LocationSearches[relTypeId] = '?' + params;

		return url;
	},

	_initItem: function () {
		const parent = this.args.window;
		const result = this._fireOverriddenFunction('initItem');
		if (result !== undefined) {
			this.item = parent.item;
			return result;
		}

		this.item =
			parent.item || this.aras.getItemById(this.itemTypeName, this.itemId, 0);
		if (!this.item) {
			this.aras.AlertError(
				this.aras.getResource('', 'relationships.lost_reference')
			);
			return;
		}
		if (this.item.node) {
			this.item = this.item.node;
		}
		parent.thisItem = this.aras.IomInnovator.newItem();
		parent.thisItem.dom = this.item.ownerDocument;
		parent.thisItem.node = this.item;
	},

	_loadFrame: function (tabId, frame, previousFrame) {
		if (!this.frames.has(frame)) {
			this.frames.add(frame);
			frame.src = this._getIFrameSrc(tabId);
			this.iframesCollection[tabId] = frame;

			this._setFrameLoadedState(frame, false);
			this._registerRelationshipEventHandlers(frame);
		}

		this._unloadFrame(previousFrame);
		this.activeFrames.add(frame);

		const onTabSelected = frame.contentWindow.onTabSelected;
		if (onTabSelected) {
			onTabSelected();
		}

		if (frame.contentWindow.searchContainer) {
			frame.contentWindow.searchContainer.onStartSearchContainer();
		}
	},

	_registerRelationshipEventHandlers: function (frame) {
		const self = this;

		const onLoadHandler = function (e) {
			if (this.src === 'about:blank') {
				return;
			}

			self._setFrameLoadedState(frame, true);
			self._registerShortcuts(e);
		};
		window.addEventListener('unload', function () {
			frame.removeEventListener('load', onLoadHandler);
		});
		frame.addEventListener('load', onLoadHandler);
	},

	_registerShortcuts: function (event) {
		const parent = this.args.window;
		const topWindow = this.aras.getMostTopWindowWithAras(parent);
		const targetWindow = event.target.contentWindow;
		const loadParams = {
			locationName: 'ItemWindowRelationshipsShortcuts',
			item_classification: '%all_grouped_by_classification%'
		};
		const settings = {
			windows: [targetWindow],
			context: targetWindow,
			registerChildFrames: true
		};
		topWindow.cui.loadShortcutsFromCommandBarsAsync(loadParams, settings);

		if (topWindow === targetWindow) {
			return;
		}

		if (topWindow.ITEM_WINDOW) {
			topWindow.ITEM_WINDOW.registerStandardShortcuts(targetWindow, true, true);
		}

		if (topWindow.returnBlockerHelper) {
			topWindow.returnBlockerHelper.attachBlocker(targetWindow);
		}
	},

	_replaceViewParameters: function (viewParameters, defaultParams) {
		const supportedParams = Object.assign(
			{
				tabID: defaultParams.relTypeID,
				itemTypeName: defaultParams.ITName,
				isEditMode: this.isEditMode
			},
			defaultParams
		);

		return viewParameters
			.replace(/(^['"])|(['"]$)|['"]\s*\+\s*['"]/g, '')
			.replace(/['"]\s*\+\s*(\w+)\s*\+?\s*['"]?/g, function (match, paramName) {
				return supportedParams[paramName];
			});
	},

	_resolveOnloadPromise: function () {},

	_setFrameLoadedState: function (frame, loaded) {
		if (loaded) {
			frame.setAttribute('loaded', '');
		} else {
			frame.removeAttribute('loaded');
		}

		const itemSpinner = document.getElementById('dimmer_spinner');
		if (!itemSpinner.classList.contains('aras-hide') && !loaded) {
			return;
		}

		this._toggleSpinner(frame, !loaded);
	},

	_toggleSpinner: function (frame, show) {
		const spinner = frame.closest('aras-switcher').nextElementSibling;
		if (spinner) {
			spinner.classList.toggle('aras-hide', !show);
		}
	},

	_unloadFrame: function (frame) {
		if (!frame) {
			return;
		}

		if (this.activeFrames.has(frame)) {
			this.activeFrames.delete(frame);
		}

		if (frame.contentWindow && frame.contentWindow.searchContainer) {
			frame.contentWindow.searchContainer.onEndSearchContainer();
		}
	},

	_setQueryParams: function (queryParams, values) {
		Object.keys(values).forEach(function (param) {
			queryParams.set(param, values[param]);
		});
	},

	_setNewMode: function (name, updatedItem) {
		const result = this._fireOverriddenFunction(name, [updatedItem]);
		if (result !== undefined) {
			return result;
		}

		this._initItem();
		this.isEditMode = name === 'setEditMode';
		this._initIframesCollection();
		this.activeFrames.forEach(function (frame) {
			if (frame.contentWindow && frame.contentWindow[name]) {
				frame.contentWindow[name](this.item);
			}
		}, this);
	},

	startup: function () {
		const result = this._fireOverriddenFunction('onload_handler');
		if (result !== undefined) {
			return result;
		}

		this._initIframesCollection();
		this.relTabbar = new RelationshipsTabbarWrapper();
		this.relTabbar.onClick = this.loadRelationshipFrame.bind(this);
		this.relTabbarReady = true;

		Object.defineProperty(this, 'currTabID', {
			get: function () {
				return this.relTabbar.GetSelectedTab();
			}
		});

		const isParamTabVisible = this.aras.uiIsParamTabVisible(this.item);
		if (!isParamTabVisible) {
			this.relTabbar.setTabVisible('Parameters', false);
		}
		const openTabId = this.getFirstEnabledTabID();
		if (openTabId) {
			this.relTabbar.selectTab(openTabId);

			const currentFrame = this.iframesCollection[openTabId];
			if (!currentFrame.hasAttribute('loaded')) {
				currentFrame.addEventListener('load', this._resolveOnloadPromise);
				return;
			}
		}

		this._resolveOnloadPromise();
	}
};
