define([
	'dojo/_base/declare',
	'dijit/layout/ContentPane',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, ContentPane, Eventable) {
	return declare([Eventable], {
		viewController: null,
		panelWidget: null,
		id: null,
		isVisible: null,
		isDomCreated: false,
		_uniqueIdCounter: {
			counter: 0
		},
		_panelConfig: null,

		constructor: function (viewController, panelConfig) {
			panelConfig = panelConfig || {};

			this._constructorInitProperties(viewController, panelConfig);
			this._attachControllerEventListeners();
			this._attachCustomEventListeners(panelConfig.eventListeners);

			if (this.isVisible) {
				this._createDom();
			}
		},

		_constructorInitProperties: function (viewController, panelConfig) {
			var panelWidth = parseInt(panelConfig.width);

			this.viewController = viewController;
			this.id = panelConfig.name || this._getUniqueId();
			this.isVisible =
				panelConfig.visible === undefined ? true : Boolean(panelConfig.visible);
			this.isDomCreated = false;
			this._panelConfig = panelConfig;
			this.defaultWidth = isNaN(panelWidth) ? undefined : panelWidth;
		},

		_createDom: function () {
			var panelConfig = this._panelConfig || {};

			this.panelWidget = this._createPanelWidget(panelConfig.widgetParameters);
			this._buildPanelContent();

			this.isDomCreated = true;
		},

		_buildPanelContent: function () {},

		_createPanelWidget: function (widgetParameters) {
			widgetParameters = widgetParameters || {};
			widgetParameters.id = widgetParameters.id || this.id;

			return new ContentPane(widgetParameters);
		},

		_getUniqueId: function (eventName) {
			return 'viewPanel_' + this._uniqueIdCounter.counter++;
		},

		_attachControllerEventListeners: function () {},

		_attachCustomEventListeners: function (listenerList) {
			var eventName;
			var listenerDescriptor;

			listenerList = listenerList || {};

			for (eventName in listenerList) {
				listenerDescriptor = listenerList[eventName];

				if (listenerDescriptor) {
					listenerDescriptor =
						typeof listenerDescriptor == 'function'
							? { handler: listenerDescriptor }
							: listenerDescriptor;

					if (listenerDescriptor.handler) {
						this.addEventListener(
							listenerDescriptor.owner || window,
							listenerDescriptor.context,
							eventName,
							listenerDescriptor.handler
						);
					}
				}
			}
		},

		_setPanelVisibility: function (doVisible) {
			doVisible = Boolean(doVisible);

			if (this.isVisible !== doVisible) {
				this.isVisible = doVisible;

				if (doVisible && !this.isDomCreated) {
					this._createDom();
				}

				this.panelWidget.domNode.style.display = doVisible ? '' : 'none';
				this.raiseEvent('onVisibilityChanged', this, doVisible);
			}
		},

		getSharedData: function (parameterName) {
			return (
				this.viewController && this.viewController.getSharedData(parameterName)
			);
		},

		setSharedData: function (parameterName, parameterValue) {
			return (
				this.viewController &&
				this.viewController.setSharedData(parameterName, parameterValue)
			);
		},

		hide: function () {
			this._setPanelVisibility(false);
		},

		show: function () {
			this._setPanelVisibility(true);
		},

		activate: function () {
			return this.viewController.activatePanel(this);
		},

		deactivate: function () {
			return this.viewController.deactivatePanel(this);
		},

		isActive: function () {
			return this.viewController.isPanelActive(this);
		},

		wrapInTag: function (sourceString, tagName, tagAttributes) {
			if (tagName) {
				var attributeString = '';

				if (tagAttributes) {
					for (var attributeName in tagAttributes) {
						attributeString +=
							' ' + attributeName + '="' + tagAttributes[attributeName] + '"';
					}
				}

				return (
					'<' +
					tagName +
					attributeString +
					'>' +
					sourceString +
					'</' +
					tagName +
					'>'
				);
			} else {
				return sourceString;
			}
		},

		destroy: function () {
			this.removeEventListeners(this.viewController);

			if (this.isDomCreated) {
				this.panelWidget.destroy();

				this.panelWidget = null;
				this.isDomCreated = false;
			}

			this.raiseEvent('onPanelDestroy', this);
		}
	});
});
