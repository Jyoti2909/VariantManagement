ViewController = function (dataItem, isEditMode) {
	this.domNode = null;
	this.item = dataItem;
	this.activeViewId = "";

	this._isEditMode = isEditMode;
	this._panels = [];
	this._panelsById = {};
	this._panelIdCounter = 0;
	this._viewCounter = 0;
	this.eventCallbacks = {};
	this.share = {
		controller: this,
		classes: {},
		controls: {},
		functions: {},
		properties: {},
		variables: {},
		internal: {}
	};

	Object.defineProperty(this, "panelsCount", {
		get: function () { return this._panels.length; }
	});

	Object.defineProperty(this, "isEditMode", {
		get: function () { return this._isEditMode; },
		set: function (isEdit) {
			this._isEditMode = isEdit;
			this.raiseEvent("onEditModeChanged", undefined, isEdit ? "edit" : "view");
		}
	});
};

ViewController.prototype.configureView = function f_configureView(configuration, keepSharedItems) {
	if (configuration) {
		var panelConfig, viewPanel, panelType,
			i;

		this.activeViewId = configuration.id || "view_" + this._viewCounter++;

		if (configuration.panels) {
			for (i = 0; i < configuration.panels.length; i++) {
				panelConfig = configuration.panels[i];
				panelType = panelConfig.type || "";
				viewPanel = this.createViewPanel(panelConfig);
				if (viewPanel) {
					this._panels.push(viewPanel);
					this._panelsById[viewPanel.id] = viewPanel;
				}
			}
		}

		if (this.panelsCount) {
			this.buildViewDom();
		}

		this.raiseEvent("onViewConfigured");
	}
};

ViewController.prototype.createViewPanel = function (panelConfig) {
	switch (panelConfig.type) {
		case "gantt":
			return new UrlViewPanel(this, panelConfig, "./ganttPanel.html");
		case "itemform":
			return new UrlViewPanel(this, panelConfig, "./formPanel.html");
		default:
			return null;
	}
};

ViewController.prototype.cleanView = function (keepSharedItems) {
	var viewPanel, i;

	for (i = 0; i < this._panels.length; i++) {
		viewPanel = this._panels[i];
		viewPanel.destroy();
	}

	this.domNode.innerHTML = "";
	this._panels.length = 0;
	this._panelsById = {};

	if (!keepSharedItems) {
		this.share = {
			controller: this,
			classes: {},
			controls: {},
			functions: {},
			properties: {},
			variables: {},
			internal: {}
		};
	}

	this.raiseEvent("onViewDestroyed");
};

ViewController.prototype.buildViewDom = function () {
	var self = this,
		parentDocument = this.domNode.ownerDocument,
		layoutPriority = 10,
		predefinedPanelsWidth = 0,
		predefinedCount = 0,
		useCommonWidth = false,
		panel, panelNode, panelContainerWidget,
		panelRegion, panelStyle, panelWidth, containerWidth,
		i;

	containerWidth = this.domNode.offsetWidth;

	for (i = 0; i < this.panelsCount; i++) {
		panelWidth = this._panels[i].defaultWidth;

		if (panelWidth) {
			predefinedPanelsWidth += panelWidth;
			predefinedCount++;
		}
	}

	// if predefined panel widths exceeds container width, that use default calculation
	if (predefinedPanelsWidth > containerWidth - 100) {
		commonPanelWidth = parseInt(containerWidth / this.panelsCount + 1);
		useCommonWidth = true;
	}
	else {
		commonPanelWidth = parseInt((containerWidth - predefinedPanelsWidth) / (this.panelsCount + 1 - predefinedCount));
	}

	for (i = 0; i < this.panelsCount; i++) {
		panel = this._panels[i];
		panel.panelIndex = i;
		panelWidth = 'width:' + (panel.defaultWidth && !useCommonWidth ? panel.defaultWidth + 'px;' : commonPanelWidth + 'px;');
		panelStyle = 'overflow:hidden; padding:0px;' + panelWidth;

		var splitterNode = parentDocument.createElement('div');
		splitterNode.classList.add('aras-splitter');
		this.domNode.appendChild(splitterNode);

		var parentPane = parentDocument.createElement('div');
		parentPane.classList = 'viewPanelWrapper';
		parentPane.style.cssText = panelStyle;
		this.domNode.appendChild(parentPane);

		panelNode = parentDocument.createElement('iframe');
		panelNode.className = 'viewPanel';
		panelNode.setAttribute('panelid', panel.id);
		panelNode.setAttribute('frameborder', 0);
		parentPane.appendChild(panelNode);

		panel.parentPane = parentPane;
		panel.contentNode = panelNode;
		panel.splitter = splitterNode;

		if (panel.visible) {
			panel.buildContent();
		}
		else {
			parentPane.style.display = 'none';
			splitterNode.style.display = 'none';
		}

	}
};

ViewController.prototype.getEventCallbackCache = function (eventName) {
	if (!this.eventCallbacks[eventName]) {
		this.eventCallbacks[eventName] = [];
	}

	return this.eventCallbacks[eventName];
};

ViewController.prototype.getNewPanelId = function (eventName) {
	return "viewPanel_" + this._panelIdCounter++;
};

ViewController.prototype.getPanelById = function (panelId) {
	return this._panelsById[panelId];
};

ViewController.prototype.getPanelByIndex = function (panelIndex) {
	return this._panels[panelIndex];
};

ViewController.prototype.addEventListener = function (/*owner*/ contextObject,/*string*/ eventName,/*function*/ eventCallback, customPanelId) {
	if (eventName, eventCallback) {
		var callbacksCache = this.getEventCallbackCache(eventName);

		callbacksCache.push({
			panel: customPanelId,
			context: contextObject,
			callback: eventCallback
		});
	}
};

ViewController.prototype.removeEventListeners = function (panelId) {
	var eventName,
		callbacksCache,
		i;

	for (eventName in this.eventCallbacks) {
		callbacksCache = this.getEventCallbackCache(eventName);

		for (i = callbacksCache.length - 1; i >= 0; i--) {
			eventCallback = callbacksCache[i];

			if (eventCallback.panel === panelId) {
				callbacksCache.splice(i, 1);
			}
		}
	}
};

// raises event for viewController and all panels, except panel with id = sourcePanelId
ViewController.prototype.raiseEvent = function f_raiseEvent(eventName, sourcePanelId) {
	if (this.eventCallbacks[eventName]) {
		var eventCallback,
			eventArguments = Array.prototype.slice.call(arguments, 2),
			viewPanel, isPanelCallback, callbackAllowed,
			i;

		for (i = 0; i < this.eventCallbacks[eventName].length; i++) {
			eventCallback = this.eventCallbacks[eventName][i];
			isPanelCallback = (eventCallback.panel !== undefined);
			callbackAllowed = false;

			if (isPanelCallback) {
				if (eventCallback.panel !== sourcePanelId) {
					viewPanel = this._panelsById[eventCallback.panel];
					callbackAllowed = viewPanel ? viewPanel.visible : true;
				}
			}
			else {
				callbackAllowed = true;
			}

			if (callbackAllowed) {
				eventCallback.callback.apply(eventCallback.context, eventArguments);
			}
		}
	}
};

// raises event only for viewController and panel with id = panelId
ViewController.prototype.raiseEventForPanel = function (eventName, panelId) {
	if (this.eventCallbacks[eventName]) {
		var eventCallback,
			eventArguments = Array.prototype.slice.call(arguments, 2),
			i;

		for (i = 0; i < this.eventCallbacks[eventName].length; i++) {
			eventCallback = this.eventCallbacks[eventName][i];

			if (!eventCallback.panel || eventCallback.panel === panelId) {
				eventCallback.callback.apply(eventCallback.context, eventArguments);
			}
		}
	}
};

ViewController.prototype.hidePanel = function (panelId) {
	var viewPanel = this._panelsById[panelId];

	if (viewPanel) {
		viewPanel.hide();
	}
};

ViewController.prototype.showPanel = function (panelId) {
	var viewPanel = this._panelsById[panelId];

	if (viewPanel) {
		viewPanel.show();
	}
};