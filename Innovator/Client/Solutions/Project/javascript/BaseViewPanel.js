function extendPanelClass(Child, Parent) {
	var F = function () { };
	F.prototype = Parent.prototype;
	Child.prototype = new F();

	Child.prototype.constructor = Child;
	Child.superclass = Parent.prototype;
}

BaseViewPanel = function (viewController, panelConfig) {
	var panelWidth;

	this.viewController = viewController;
	this.type = "BaseViewPanel";
	this.contentNode = null;
	this.parentPane = null;
	this.panelIndex = -1;
	this.id = this.viewController.getNewPanelId();
	this.name = panelConfig.name || this.type + this.id;
	this.visible = (panelConfig.visible === undefined) ? true : Boolean(panelConfig.visible);
	this.toggleable = (panelConfig.toggle === undefined) ? false : Boolean(panelConfig.toggle);
	this.domCreated = false;
	this.userData = {};

	panelWidth = parseInt(panelConfig.width);
	this.defaultWidth = isNaN(panelWidth) ? undefined : panelWidth;
};

BaseViewPanel.prototype.buildContent = function () {
	this.domCreated = true;
	this.viewController.raiseEvent("onPanelCreate", undefined, this.id);
};

BaseViewPanel.prototype.addControllerEventListener = function (/*owner*/ contextObject,/*string*/ eventName,/*function*/ eventCallback) {
	if (eventName, eventCallback) {
		var callbacksCache = this.viewController.getEventCallbackCache(eventName);

		callbacksCache.push({
			panel: this.id,
			context: contextObject,
			callback: eventCallback
		});
	}
};

BaseViewPanel.prototype.removeEventListeners = function () {
	this.viewController.removeEventListeners(this.id);
};

BaseViewPanel.prototype.hide = function () {
	if (this.visible) {
		this.visible = false;
		this.splitter.style.display = 'none';
		this.parentPane.style.display = 'none';
		this.viewController.raiseEventForPanel('onPanelHide', this.id);
	}
};

BaseViewPanel.prototype.show = function () {
	if (!this.visible) {
		this.visible = true;

		if (!this.domCreated) {
			this.buildContent();
		}

		if (this.parentPane._splitterWidget) {
			this.parentPane._splitterWidget.domNode.style.display = "";
		}
		this.parentPane.domNode.style.display = "";
		this.viewController.containerWidget.layout();

		this.viewController.raiseEventForPanel("onPanelShow", this.id);
	}
};

BaseViewPanel.prototype.raiseEvent = function (eventName) {
	if (arguments.length) {
		var methodArguments = arguments;

		if (arguments.length == 1) {
			methodArguments[1] = this.id;
		}
		else {
			Array.prototype.splice.call(methodArguments, 1, 0, this.id);
		}

		this.viewController.raiseEvent.apply(this.viewController, methodArguments);
	}
};

BaseViewPanel.prototype.destroy = function () {
	this.viewController.raiseEventForPanel("onPanelDestroy", this.id);
	this.removeEventListeners();
};