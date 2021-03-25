UrlViewPanel = function (viewController, panelConfig, pageUrl) {
	UrlViewPanel.superclass.constructor.call(this, viewController, panelConfig);

	this.type = "UrlViewPanel";
	this.defaultUrl = "#";
	this.frameSrc = pageUrl || this.defaultUrl;
	this.loaded = false;
};

// inherits from BaseViewPanel
extendPanelClass(UrlViewPanel, BaseViewPanel);

UrlViewPanel.prototype.buildContent = function () {
	if (this.contentNode) {
		this.contentNode.src = this.frameSrc;
	}

	UrlViewPanel.superclass.buildContent.call(this);
};

UrlViewPanel.prototype.show = function () {
	if (!this.visible) {
		this.visible = true;

		if (!this.domCreated) {
			this.buildContent();
		}

		this.splitter.style.display = '';
		this.parentPane.style.display = '';

		if (this.loaded) {
			this.viewController.raiseEventForPanel("onPanelShow", this.id);
		}
		else {
			var onLoadHandler = function () {
				new ArasModules.splitter(this.splitter);
				this.viewController.raiseEventForPanel("onPanelShow", this.id);
				this.contentNode.removeEventListener("load", onLoadHandler);
				this.loaded = true;
			}.bind(this);

			this.contentNode.addEventListener("load", onLoadHandler, false);
		}
	}
};

UrlViewPanel.prototype.setUrl = function (pageUrl) {
	if (this.domCreated) {
		this.destroy();
	}

	this.frameSrc = pageUrl || this.defaultUrl;
	this.contentNode.src = this.frameSrc;
	UrlViewPanel.superclass.buildContent.call(this);
};

UrlViewPanel.prototype.getUrl = function () {
	return this.frameSrc;
};