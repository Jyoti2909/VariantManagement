define([
	'dojo/_base/declare',
	'dijit/layout/BorderContainer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/SideBySideView/BaseViewPanel',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/SideBySideView/UrlViewPanel',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
], function (declare, BorderContainer, BaseViewPanel, UrlViewPanel, Eventable) {
	return declare([Eventable], {
		domNode: null,
		containerNode: null,
		viewWidget: null,
		activePanel: null,
		id: '',
		_panels: null,
		_panelsById: null,
		_uniqueIdCounter: {
			counter: 0
		},
		_share: null,
		_isViewInitialized: false,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this.containerNode =
				initialParameters.containerNode ||
				(initialParameters.connectId &&
					document.getElementById(initialParameters.connectId)) ||
				document.body;
			this.id = initialParameters.id || this._getUniqueId();

			this._isEditMode = initialParameters.isEditMode;
			this._panels = [];
			this._panelsById = {};
			this._viewCounter = 0;
			this.eventCallbacks = {};
			this._share = {};

			this._defineViewProperties();
			this._buildViewDom();
		},

		_defineViewProperties: function () {
			Object.defineProperty(this, 'panelsCount', {
				get: function () {
					return this._panels.length;
				}
			});

			Object.defineProperty(this, 'isEditMode', {
				get: function () {
					return this._isEditMode;
				},
				set: function (doEditable) {
					doEditable = Boolean(doEditable);

					if (this._isEditMode !== doEditable) {
						this._isEditMode = doEditable;
						this.raiseEvent('onEditModeChanged', doEditable);
					}
				}
			});
		},

		_getUniqueId: function (eventName) {
			return 'view_' + this._uniqueIdCounter.counter++;
		},

		configureView: function (viewConfiguration, keepSharedItems) {
			if (viewConfiguration) {
				var viewPanelsData =
					Array.isArray(viewConfiguration.panels) && viewConfiguration.panels;

				this.cleanView(keepSharedItems);

				if (viewPanelsData) {
					var panelsCount = viewPanelsData.length;
					var containerWidth = this.viewWidget.domNode.offsetWidth;
					var useCommonWidth = false;
					var predefinedPanelsWidth = 0;
					var predefinedCount = 0;
					var panelConfig;
					var viewPanel;
					var panelWidth;
					var commonPanelWidth;
					var i;

					for (i = 0; i < viewPanelsData.length; i++) {
						panelConfig = viewPanelsData[i];
						panelWidth = panelConfig.defaultWidth;

						if (panelWidth) {
							predefinedPanelsWidth += panelWidth;
							predefinedCount++;
						}
					}

					// if predefined panel widths exceeds container width, that use default calculation
					if (predefinedPanelsWidth > containerWidth - 100) {
						commonPanelWidth = parseInt(100 / panelsCount);
						useCommonWidth = true;
					} else {
						commonPanelWidth = parseInt(
							(100 *
								((containerWidth - predefinedPanelsWidth) / containerWidth)) /
								(panelsCount - predefinedCount)
						);
					}

					for (i = 0; i < viewPanelsData.length; i++) {
						panelConfig = viewPanelsData[i];
						panelConfig.widgetParameters = {
							region: i ? 'trailing' : 'center',
							splitter: true,
							layoutPriority: -i,
							style:
								'width:' +
								(panelConfig.defaultWidth && !useCommonWidth
									? panelConfig.defaultWidth + 'px;'
									: commonPanelWidth + '%;')
						};

						viewPanel = this.createViewPanel(panelConfig);

						if (viewPanel) {
							this.addViewPanel(viewPanel);
						}
					}
				}

				this._isViewInitialized = true;
				this.viewWidget.layout();
				this.raiseEvent('onViewConfigured');
			}
		},

		createViewPanel: function (panelConfig) {
			panelConfig = panelConfig || {};

			switch (panelConfig.type) {
				case 'url':
					return new UrlViewPanel(this, panelConfig);
				default:
					return new BaseViewPanel(this, panelConfig);
			}
		},

		getSharedData: function (parameterName) {
			return this._share[parameterName];
		},

		setSharedData: function (parameterName, parameterValue) {
			if (parameterName) {
				this._share[parameterName] = parameterValue;
				this.raiseEvent('onDataShared', parameterName, parameterValue);
			}
		},

		cleanView: function (keepSharedItems) {
			var descendantSplitters = this.viewWidget
				.getDescendants()
				.filter(function (descendantWidget) {
					return descendantWidget.declaredClass == 'dijit.layout._Splitter';
				});
			var viewPanel;
			var i;

			for (i = 0; i < descendantSplitters.length; i++) {
				descendantSplitters[i].destroy();
			}

			for (i = 0; i < this._panels.length; i++) {
				viewPanel = this._panels[i];
				viewPanel.destroy();
			}

			this.domNode.innerHTML = '';
			this._panels.length = 0;
			this._panelsById = {};

			if (!keepSharedItems) {
				this._share = {};
			}

			this.raiseEvent('onViewDestroyed');
		},

		_buildViewDom: function () {
			var borderContainerWidget = new BorderContainer({
				id: this.id,
				design: 'sidebar',
				liveSplitters: false,
				gutters: false,
				domNode: this.containerNode
			});

			borderContainerWidget.startup();

			this.viewWidget = borderContainerWidget;
			this.domNode = borderContainerWidget.domNode;
		},

		addViewPanel: function (targetPanel) {
			if (targetPanel) {
				var panelId = targetPanel.id;

				if (!this._panelsById[panelId]) {
					this._panels.push(targetPanel);
					this._panelsById[targetPanel.id] = targetPanel;

					if (targetPanel.isDomCreated) {
						this.viewWidget.addChild(targetPanel.panelWidget);
					}

					this._attachPanelEventListeners(targetPanel);
					this.raiseEvent('onNewPanel', targetPanel);
				}
			}
		},

		_attachPanelEventListeners: function (targetPanel) {
			targetPanel.addEventListener(
				this,
				this,
				'onVisibilityChanged',
				this._onPanelVisibilityChanged
			);
			targetPanel.addEventListener(
				this,
				this,
				'onPanelDestroy',
				this._onPanelDestroy
			);
		},

		isViewInitialized: function () {
			return this._isViewInitialized;
		},

		_onPanelVisibilityChanged: function (targetPanel, isPanelVisible) {
			var panelWidget = targetPanel.panelWidget;

			if (isPanelVisible) {
				// check if panel widget is already added to view widget as a child
				var registeredPanelWidgets = this.viewWidget.getChildren();
				var panelIndex = registeredPanelWidgets.indexOf(panelWidget);

				if (panelIndex == -1) {
					this.viewWidget.addChild(panelWidget);
				}
			}

			if (panelWidget && panelWidget._splitterWidget) {
				var splitterStyle = panelWidget._splitterWidget.domNode.style;

				splitterStyle.display = isPanelVisible ? '' : 'none';
			}

			this.viewWidget.layout();
		},

		_onPanelDestroy: function (targetPanel) {
			this.removeEventListeners(targetPanel);
		},

		getPanelById: function (panelId) {
			return this._panelsById[panelId];
		},

		getPanelByIndex: function (panelIndex) {
			return (
				panelIndex >= 0 &&
				panelIndex < this._panels.length &&
				this._panels[panelIndex]
			);
		},

		hidePanel: function (panelId) {
			var viewPanel =
				typeof panelId == 'string' ? this._panelsById[panelId] : panelId;

			if (viewPanel) {
				viewPanel.hide();
			}
		},

		showPanel: function (panelId) {
			var viewPanel =
				typeof panelId == 'string' ? this._panelsById[panelId] : panelId;

			if (viewPanel) {
				viewPanel.show();
			}
		},

		activatePanel: function (panelId) {
			const viewPanel =
				typeof panelId == 'string' ? this._panelsById[panelId] : panelId;
			const activePanel = this.activePanel;

			if (viewPanel && viewPanel !== activePanel) {
				this.deactivatePanel(activePanel);

				this.activePanel = viewPanel;
				this.raiseEvent('onPanelActivated', viewPanel);
			}
		},

		deactivatePanel: function (panelId) {
			const viewPanel =
				typeof panelId == 'string' ? this._panelsById[panelId] : panelId;
			const activePanel = this.activePanel;

			if (viewPanel && viewPanel === activePanel) {
				this.activePanel = null;
				this.raiseEvent('onPanelDeactivated', viewPanel);
			}
		},

		isPanelActive: function (panelId) {
			const viewPanel =
				typeof panelId == 'string' ? this._panelsById[panelId] : panelId;

			return viewPanel && viewPanel === this.activePanel;
		}
	});
});
