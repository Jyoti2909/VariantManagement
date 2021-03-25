function initEditorTabViewController(container) {
	container.aras = container.parent.aras;
	container.viewsController = container.parent.tabViewsController;
	container.isUIControlsCreated = false;
	container.viewContext = {
		data: {
			documentItem: null,
			documentViewSettings: null,
			activeDocumentId: null
		},
		controls: {
			sbsViewController: null,
			primaryViewPanel: null,
			secondaryViewPanel: null
		},
		topWindow: container.aras.getMostTopWindowWithAras(window),
		editState: null
	};

	container.loadView = function (newDocumentItem) {
		if (this.isUIControlsCreated) {
			this.reloadView(newDocumentItem);
		} else {
			this.setViewDocumentItem(newDocumentItem);
			this.setActiveDocumentId(newDocumentItem.getAttribute('id'));

			return this.createUIControls();
		}
	};

	container.unloadView = function () {
		const primaryViewPanel = this.viewContext.controls.primaryViewPanel;
		primaryViewPanel.activate();
	};

	container.reloadView = function (newDocumentItem) {
		const activeDocumentId = this.viewContext.data.activeDocumentId;

		this.setViewDocumentItem(newDocumentItem);
		this.updateOriginDocumentPanels(activeDocumentId, newDocumentItem);
		this.setActiveDocumentId(newDocumentItem.getAttribute('id'));
	};

	container.setViewDocumentItem = function (newDocumentItem) {
		const viewData = this.viewContext.data;
		const primaryDocument = viewData.documentItem;

		if (
			!primaryDocument ||
			this.aras.getItemProperty(primaryDocument, 'is_current') === '1'
		) {
			viewData.documentItem = newDocumentItem;
		}
	};

	container.updateOriginDocumentPanels = function (
		panelDocumentId,
		newDocumentItem
	) {
		const viewController = this.viewContext.controls.sbsViewController;
		const documentViewSettings = this.viewContext.data.documentViewSettings;
		const newDocumentId = newDocumentItem.getAttribute('id');
		const isDirty = newDocumentItem.getAttribute('isDirty') === '1';

		for (let i = 0; i < viewController.panelsCount; i++) {
			const currentPanel = viewController.getPanelByIndex(i);
			const panelSettings = documentViewSettings[currentPanel.id];

			if (panelSettings.documentItemId === panelDocumentId) {
				panelSettings.documentItem = newDocumentItem;
				panelSettings.documentItemId = newDocumentId;

				if (currentPanel.isVisible) {
					this.loadPanelViewData(currentPanel, !isDirty);
				}
			}
		}
	};

	container.loadPanelViewData = function (targetPanel, forceReload) {
		if (this.isUIControlsCreated && targetPanel) {
			if (targetPanel.isFrameLoaded) {
				this.onPanelLoaded(targetPanel, forceReload);
			} else {
				return new Promise(
					function (loadResolve) {
						const eventListener = targetPanel.addEventListener(
							this,
							this,
							'onFrameContentLoaded',
							function () {
								eventListener.remove();

								Promise.resolve(
									this.onPanelLoaded(targetPanel, forceReload)
								).then(function () {
									loadResolve();
								});
							}.bind(this)
						);
					}.bind(this)
				);
			}
		}
	};

	container.onPanelLoaded = function (targetPanel, forceReload) {
		const viewData = this.viewContext.data;
		const panelFrameWindow = targetPanel.getFrameWindow();
		const panelViewSettings = viewData.documentViewSettings[targetPanel.id];

		if (!targetPanel.isInitialized) {
			panelFrameWindow.initializeView({
				aras: this.aras
			});
			targetPanel.isInitialized = true;
		}

		return Promise.resolve(
			panelFrameWindow.setupView(panelViewSettings, {
				forceReload: forceReload
			})
		);
	};

	container.getDefaultLaguageCode = function () {
		let languageCode = this.aras.getVariable('tp_DefaultLanguageCode');

		if (!languageCode) {
			let methodItem = this.aras.newIOMItem(
				'Method',
				'tp_GetDefaultLanguageCode'
			);

			methodItem = methodItem.apply();
			languageCode = methodItem.getResult();
			this.aras.setVariable('tp_DefaultLanguageCode', languageCode);
		}

		return languageCode;
	};

	container.getLanguageList = function () {
		const languageItemNodes = this.aras
			.getLanguagesResultNd()
			.selectNodes('.//Item[@type="Language"]');
		const resultList = {};

		for (let i = 0; i < languageItemNodes.length; i++) {
			const currentNode = languageItemNodes[i];
			const propertyValue = this.aras.getItemProperty(currentNode, 'code');

			resultList[propertyValue] = this.aras.getItemProperty(
				currentNode,
				'name'
			);
		}

		return resultList;
	};

	container.getConfigurableUIData = function () {
		const viewData = this.viewContext.data;
		const responceData = this.aras.MetadataCache.GetConfigurableUi({
			item_type_id: this.aras.getItemTypeId(
				viewData.documentItem.getAttribute('type')
			),
			location_name: 'HtmlRichTextEditor'
		});

		return responceData && responceData.results;
	};

	container.createViewSettings = function () {
		const viewData = this.viewContext.data;
		const languageCode = this.getDefaultLaguageCode();
		const documentViewSettings = {
			viewType: 'single', // [single|sidebyside],
			defaultLanguageCode: languageCode,
			primaryView: {
				isPrimaryView: true,
				displayType: 'html',
				documentItem: viewData.documentItem,
				documentItemId: viewData.documentItem.getAttribute('id'),
				languageCode: languageCode,
				filteredContentView: 'inactive',
				filterFamilies: {}
			},
			secondaryView: {
				displayType: 'html',
				documentItem: null,
				documentItemId: '',
				languageCode: languageCode,
				filteredContentView: 'inactive',
				filterFamilies: {}
			}
		};

		return documentViewSettings;
	};

	container.onViewSettingsChanged = function (documentViewSettings) {
		const primaryViewPanel = this.viewContext.controls.primaryViewPanel;
		const secondaryViewPanel = this.viewContext.controls.secondaryViewPanel;
		const primaryViewSettings = documentViewSettings.primaryView;

		this.loadPanelViewData(primaryViewPanel);

		if (documentViewSettings.viewType == 'single') {
			secondaryViewPanel.hide();
		} else {
			const secondaryViewSettings = documentViewSettings.secondaryView;

			secondaryViewSettings.documentItem = this.aras.getItemById(
				primaryViewSettings.documentItem.getAttribute('type'),
				secondaryViewSettings.documentItemId
			);

			secondaryViewPanel.show();
			this.loadPanelViewData(secondaryViewPanel, true);
		}
	};

	container.setActiveDocumentId = function (documentId) {
		this.viewContext.data.activeDocumentId = documentId;
	};

	container.onPanelActivatedHandler = function (targetPanel, panelSettings) {
		const panelDocumentItem = panelSettings.documentItem;
		const topWindow = this.viewContext.topWindow;

		if (panelDocumentItem !== topWindow.item) {
			topWindow.item = panelDocumentItem;
			topWindow.isEditMode = this.aras.isEditStateEx(panelDocumentItem);
			this.setActiveDocumentId(panelDocumentItem.getAttribute('id'));
			topWindow.updateMenuState();
		}
	};

	container.createUIControls = function () {
		return new Promise(
			function (creationResolve) {
				require([
					'dojo/_base/declare',
					'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/SideBySideView/PanelsViewController',
					'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable'
				], function (declare, PanelsViewController, Eventable) {
					const viewData = this.viewContext.data;

					// if current document item is not temporary
					if (!this.aras.isTempEx(viewData.documentItem)) {
						const viewControls = this.viewContext.controls;
						const documentViewSettings = this.createViewSettings();
						let sbsViewController;

						viewData.documentViewSettings = declare(
							[Eventable],
							documentViewSettings
						)();
						viewData.documentViewSettings.addEventListener(
							window,
							window,
							'onSettingsChanged',
							this.onViewSettingsChanged
						);

						sbsViewController = new PanelsViewController({
							id: 'sbsViewContainer',
							connectId: 'sbsViewContainer'
						});
						sbsViewController.configureView({
							panels: [
								{
									name: 'primaryView',
									type: 'url',
									URL: '../../Modules/aras.innovator.TDF/EditorViewPanel',
									eventListeners: {
										onPanelActivated: this.onPanelActivatedHandler
									}
								},
								{
									name: 'secondaryView',
									type: 'url',
									URL: '../../Modules/aras.innovator.TDF/EditorViewPanel',
									visible: false,
									eventListeners: {
										onPanelActivated: this.onPanelActivatedHandler
									}
								}
							]
						});

						viewControls.sbsViewController = sbsViewController;
						viewControls.primaryViewPanel = sbsViewController.getPanelById(
							'primaryView'
						);
						viewControls.secondaryViewPanel = sbsViewController.getPanelById(
							'secondaryView'
						);

						sbsViewController.setSharedData(
							'documentViewSettings',
							viewData.documentViewSettings
						);
						sbsViewController.setSharedData(
							'configurableUIData',
							this.getConfigurableUIData()
						);
						sbsViewController.setSharedData(
							'systemLanguages',
							this.getLanguageList()
						);
						sbsViewController.setSharedData(
							'tdfSettings',
							this.viewsController.shareData.tdfSettings
						);

						this.isUIControlsCreated = true;
						creationResolve();
					}
				}).bind(this);
			}.bind(this)
		).then(
			function () {
				const viewControls = this.viewContext.controls;

				return this.loadPanelViewData(viewControls.primaryViewPanel);
			}.bind(this)
		);
	};
}
