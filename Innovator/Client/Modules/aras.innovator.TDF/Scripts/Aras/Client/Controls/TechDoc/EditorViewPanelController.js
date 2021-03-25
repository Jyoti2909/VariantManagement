function initEditorViewPanelControllerFunctionality(container) {
	container = container || window;

	container.isUIControlsCreated = false;
	container.isViewSettingUp = false;
	container.viewContext = undefined;
	container.aras = undefined;

	container.initializeView = function (inputParameters) {
		var ownerViewPanel = frameElement.ownerViewPanel;

		inputParameters = inputParameters || {};

		this.aras = inputParameters.aras || container.parent.aras;
		this.viewContext = {
			data: {
				structuredDocument: null,
				panelViewSettings: null,
				copiedViewSettings: null,
				isTreeExpanded: true,
				currentUser: null,
				isPanelActive: false,
				resourceStrings: {}
			},
			controls: {
				ownerPanel: ownerViewPanel,
				searchControl: null,
				editorControl: null,
				treeGridAdapter: null,
				headerControls: {
					headerContainer: document.querySelector('.viewHeader'),
					statusMark: document.querySelector('.statusMark'),
					documentInfo: document.querySelector('.documentInfo'),
					editInfo: document.querySelector('.editInfo'),
					filterInfo: document.querySelector('.filterInfo')
				},
				xmlContainer: document.querySelector('#xmlContainer'),
				htmlContainer: document.querySelector('#htmlContainer'),
				xmlContentFrame: document.querySelector('.xmlContentFrame'),
				htmlContainerWidget: null,
				treeContainerWidget: null,
				treeToggleButton: document.querySelector('.treeToggleButton')
			},
			modules: {
				XmlToHTMLTransform: null,
				Enums: null
			},
			topWindow: this.aras.getMostTopWindowWithAras(window),
			editState: null,
			isRegisterBeforeSave: false
		};
	};

	container.getResourceString = function (resourceLocation, resourceId) {
		resourceLocation = resourceLocation || '_default';

		if (resourceId) {
			var resourceStrings = this.viewContext.data.resourceStrings;
			var locationStrings =
				resourceStrings[resourceLocation] ||
				(resourceStrings[resourceLocation] = {});
			var foundResource = locationStrings[resourceId];

			if (!foundResource || arguments.length > 2) {
				foundResource = this.aras.getResource.apply(this.aras, arguments);
				locationStrings[resourceId] = foundResource;
			}

			return foundResource;
		}
	};

	container.setupView = function (viewSettings, optionalParameters) {
		optionalParameters = optionalParameters || {};

		this.isViewSettingUp = true;
		this.viewContext.data.panelViewSettings = viewSettings;
		this.updateViewHeader();

		if (
			viewSettings &&
			viewSettings.isPrimaryView &&
			!this.viewContext.isRegisterBeforeSave
		) {
			this.viewContext.isRegisterBeforeSave = true;
			this.viewContext.topWindow.registerCommandEventHandler(
				window,
				this.beforeSaveItem,
				'before',
				'save'
			);
		}

		return Promise.resolve(
			!this.isUIControlsCreated && this.createUIControls()
		).then(
			function () {
				this.applyViewSettings(viewSettings, optionalParameters);
				this.setEditState(this.isViewEditable());

				this.isViewSettingUp = false;
			}.bind(this)
		);
	};

	container.beforeSaveItem = function () {
		const viewData = this.viewContext.data;
		const documentItem = viewData.panelViewSettings.documentItem;
		if (!this.aras.isDirtyEx(documentItem)) {
			const structuredDocument = viewData.structuredDocument;
			const languageCode = structuredDocument.DefaultLanguageCode();

			this.aras.setItemTranslation(
				documentItem,
				'document_xml',
				structuredDocument.getSavedDocumentXml(languageCode),
				languageCode
			);
		}
	};

	container.updateViewHeader = function () {
		var panelViewSettings = this.viewContext.data.panelViewSettings;
		var documentItem = panelViewSettings.documentItem;
		var headerControls = this.viewContext.controls.headerControls;
		var systemLanguages = this.viewContext.controls.ownerPanel.getSharedData(
			'systemLanguages'
		);
		var languageName = systemLanguages[panelViewSettings.languageCode];
		var isCurrent =
			this.aras.getItemProperty(documentItem, 'is_current') == '1';
		var documentInfo = '';
		var filterInfo = '';
		var familyName;

		for (familyName in panelViewSettings.filterFamilies) {
			filterInfo +=
				(filterInfo ? ', ' : '') +
				panelViewSettings.filterFamilies[familyName].join(',');
		}

		filterInfo = filterInfo
			? this.getResourceString(
					'../Modules/aras.innovator.TDF',
					'viewpaneltitle.filterprefix'
			  ) +
			  ': ' +
			  filterInfo
			: '';

		documentInfo =
			this.aras.getItemProperty(documentItem, 'item_number') +
			' - ' +
			languageName +
			' - ' +
			this.aras.getItemProperty(documentItem, 'major_rev') +
			'.' +
			this.aras.getItemProperty(documentItem, 'generation') +
			(isCurrent ? ' (Current)' : '');

		headerControls.documentInfo.textContent = documentInfo;
		headerControls.editInfo.innerHTML = this.isViewReadonly()
			? '<span class="separatorSpan"> | </span>' +
			  this.getResourceString(
					'../Modules/aras.innovator.TDF',
					'viewpaneltitle.readonly'
			  )
			: '';
		headerControls.filterInfo.innerHTML = filterInfo
			? '<span class="separatorSpan"> | </span>' + filterInfo
			: '';

		headerControls.headerContainer.setAttribute(
			'title',
			documentInfo + filterInfo
		);
	};

	container.setupViewDisplayType = function (displayType) {
		var viewControls = this.viewContext.controls;

		if (displayType == 'html') {
			viewControls.xmlContainer.classList.add('inactiveDisplayContainer');
			viewControls.htmlContainer.classList.remove('inactiveDisplayContainer');

			this.layoutHtmlContainer();
		} else {
			viewControls.xmlContainer.classList.remove('inactiveDisplayContainer');
			viewControls.htmlContainer.classList.add('inactiveDisplayContainer');
		}
	};

	container.layoutHtmlContainer = function () {
		if (this.isUIControlsCreated) {
			const viewControls = this.viewContext.controls;
			viewControls.htmlContainerWidget.layout();
		}
	};

	container.applyViewSettings = function (viewSettings, optionalParameters) {
		optionalParameters = optionalParameters || {};

		if (viewSettings) {
			var viewControls = this.viewContext.controls;
			var viewData = this.viewContext.data;
			var currentSettings =
				viewData.copiedViewSettings || viewData.panelViewSettings;
			var isItemChanged =
				currentSettings.documentItem !== viewSettings.documentItem;
			var isLanguageChanged =
				currentSettings.languageCode !== viewSettings.languageCode;
			var isDocumentReloadRequired =
				isItemChanged || optionalParameters.forceReload;

			if (currentSettings.displayType !== viewSettings.displayType) {
				this.setupViewDisplayType(viewSettings.displayType);
			}

			viewData.structuredDocument.SuspendInvalidation();

			if (isDocumentReloadRequired) {
				viewData.structuredDocument.Reload(viewSettings.documentItem, {
					languageCode: viewSettings.languageCode,
					forceReload: optionalParameters.forceReload
				});
			} else if (isLanguageChanged) {
				viewData.structuredDocument.SwitchLanguage(viewSettings.languageCode);
			}

			switch (viewSettings.displayType) {
				case 'html':
					var optionalContentHelper = viewData.structuredDocument.OptionalContent();
					var displayTypes = this.viewContext.modules.Enums.DisplayType;
					var isFiltrationHidden = viewSettings.filteredContentView == 'hidden';
					var isContentFiltered =
						currentSettings.filteredContentView !==
							viewSettings.filteredContentView ||
						(isFiltrationHidden &&
							JSON.stringify(currentSettings.filterFamilies) !==
								JSON.stringify(viewSettings.filterFamilies));

					optionalContentHelper.DocumentView(viewSettings.filterFamilies);
					optionalContentHelper.DisplayPreference(
						isFiltrationHidden ? displayTypes.Hidden : displayTypes.Inactive
					);

					viewControls.searchControl.show();

					if (isItemChanged || isLanguageChanged) {
						viewControls.searchControl.cleanupResults();
					} else if (
						isContentFiltered &&
						viewControls.searchControl.isSearchActive()
					) {
						viewControls.searchControl.runSearch();
					}
					break;
				case 'xml':
					var frameDocument = viewControls.xmlContentFrame.contentDocument;
					var xmlContent = this.prepareXmlContent(
						viewData.structuredDocument.origin.ownerDocument.xml
					);

					viewControls.searchControl.hide();

					frameDocument.open();
					frameDocument.write(xmlContent);
					frameDocument.close();
					break;
			}

			// During Reload method call queue is dropped and start state is inited, but due to ResumeInvalidation is used for rendering
			// optimization and additional state can be appended during that, the initial state should be dropped
			if (isDocumentReloadRequired) {
				viewData.structuredDocument.QueueChanges().dropCurrentState();
			}

			viewData.structuredDocument.ResumeInvalidation();

			viewData.copiedViewSettings = Object.assign({}, viewSettings);
		}
	};

	container.prepareXmlContent = function (xmlData) {
		var expressionContent = '';

		if (xmlData) {
			var xslDocument = this.viewContext.modules.XmlToHTMLTransform;
			var expressionDocument = new XmlDocument();

			expressionDocument.loadXML(xmlData);
			expressionContent = expressionDocument.transformNode(xslDocument);
		}

		return expressionContent;
	};

	container.getCurrentUser = function () {
		return (
			this.viewContext.data.currentUser ||
			(this.viewContext.data.currentUser = this.aras.getUserID())
		);
	};

	container.isViewEditable = function () {
		var panelViewSettings = this.viewContext.data.panelViewSettings;
		var documentItem = panelViewSettings.documentItem;
		var documentViewSettings = this.viewContext.controls.ownerPanel.getSharedData(
			'documentViewSettings'
		);

		return (
			documentItem &&
			(this.aras.isTempEx(documentItem) ||
				(this.aras.isEditStateEx(documentItem) &&
					panelViewSettings.languageCode ===
						documentViewSettings.defaultLanguageCode))
		);
	};

	container.isViewReadonly = function () {
		var panelViewSettings = this.viewContext.data.panelViewSettings;
		var documentItem = panelViewSettings.documentItem;
		var documentViewSettings = this.viewContext.controls.ownerPanel.getSharedData(
			'documentViewSettings'
		);

		return (
			!documentItem ||
			this.aras.getItemProperty(documentItem, 'is_current') !== '1' ||
			panelViewSettings.languageCode !==
				documentViewSettings.defaultLanguageCode
		);
	};

	container.setEditState = function (newEditState) {
		if (this.viewContext.editState !== newEditState) {
			this.viewContext.editState = Boolean(newEditState);

			if (this.isUIControlsCreated) {
				var editorControl = this.viewContext.controls.editorControl;

				editorControl.set('disabled', !newEditState);
			}
		}
	};

	container.toggleTreeControl = function () {
		var viewData = this.viewContext.data;
		var viewControls = this.viewContext.controls;
		var containerWidget = viewControls.treeContainerWidget;
		var containerDomNode = containerWidget.domNode;

		viewData.isTreeExpanded = !viewData.isTreeExpanded;

		if (viewData.isTreeExpanded) {
			containerDomNode.style.width = viewData.treeOriginWidth + 'px';
			containerDomNode.classList.remove('collapsed');
		} else {
			viewData.treeOriginWidth =
				viewControls.treeContainerWidget.domNode.offsetWidth;
			containerDomNode.classList.add('collapsed');
		}

		if (containerWidget._splitterWidget) {
			containerWidget._splitterWidget.domNode.style.display = viewData.isTreeExpanded
				? ''
				: 'none';
		}

		this.layoutHtmlContainer();
	};

	container.createUIControls = function () {
		return new Promise(
			function (resolve) {
				require([
					'dojo/parser',
					'TechDoc/Aras/Client/Controls/TechDoc/Editor',
					'TechDoc/Aras/Client/Controls/TechDoc/Toolbar',
					'TechDoc/Aras/Client/Controls/TechDoc/UI/EditorViewTreeGrid/TreeGridAdapter',
					'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/StructuredDocument',
					'TechDoc/Aras/Client/Controls/TechDoc/UI/ToolbarParser',
					'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
					'dojo/aspect',
					'dojox/html/entities',
					'TechDoc/Aras/Client/Controls/TechDoc/UI/Search/SearchComponent',
					'TechDoc/Aras/Client/Controls/TechDoc/UI/Search/TextSchemaElementsSearchEngine',
					'dojo/text!TDF/Styles/XMLtoHTML.xsl'
				], function (
					parser,
					TechDocHtmlEditor,
					TechDocHtmlToolbar,
					TreeGridAdapter,
					TechDocStructuredDocument,
					ToolbarParser,
					Enums,
					aspect,
					entities,
					SearchComponent,
					TextSearchEngine,
					TranformXSL
				) {
					var viewControls = this.viewContext.controls;
					var viewData = this.viewContext.data;
					var panelViewSettings = viewData.panelViewSettings;
					var tdfSettings = viewControls.ownerPanel.getSharedData(
						'tdfSettings'
					);
					var xslDocument = new XmlDocument();
					var documentViewSettings = viewControls.ownerPanel.getSharedData(
						'documentViewSettings'
					);
					var toolbarParsedData;
					var structuredDocument;
					var toolbarDomNode;
					var editorControl;
					var searchControl;
					var optionalContentHelper;

					xslDocument.loadXML(TranformXSL);

					if (this.aras.Browser.isIe()) {
						xslDocument.setProperty(
							'SelectionNamespaces',
							'xmlns:xsl="http://www.w3.org/1999/XSL/Transform"'
						);
					} else {
						xslDocument.documentElement.setAttribute(
							'xmlns:xsl',
							'http://www.w3.org/1999/XSL/Transform'
						);
					}

					this.viewContext.modules.XmlToHTMLTransform = xslDocument;
					this.viewContext.modules.Enums = Enums;

					structuredDocument = new TechDocStructuredDocument({
						aras: this.aras,
						item: panelViewSettings.documentItem,
						defaultLanguageCode: documentViewSettings.defaultLanguageCode,
						currentLanguageCode: panelViewSettings.languageCode,
						contentBuilderMethod: tdfSettings.contentBuilderMethod,
						optionFamilies: tdfSettings.optionFamilies,
						optionFamiliesBuilderMethod:
							tdfSettings.optionFamiliesBuilderMethod,
						referenceRelationshipNames: tdfSettings.referenceRelationshipNames,
						asyncDataLoading: true,
						additionalSettings: {
							isCoreTDF: Boolean(tdfSettings.isCoreTDF),
							addContentFromTemplate: true
						}
					});
					this.viewContext.data.structuredDocument = structuredDocument;

					const parsePromise = new Promise(
						function (parseResolve) {
							parser.parse().then(
								function () {
									editorControl = dijit.byId('techDocHtmlEditor');
									viewControls.editorControl = editorControl;

									viewControls.htmlContainerWidget = dijit.byId(
										'htmlContainer'
									);
									viewControls.treeContainerWidget = dijit.byId(
										'treeContainer'
									);

									viewControls.treeToggleButton.addEventListener(
										'click',
										function (clickEvent) {
											this.toggleTreeControl();
											clickEvent.stopPropagation();
										}.bind(this)
									);
									viewControls.treeContainerWidget.domNode.addEventListener(
										'click',
										function () {
											if (!viewData.isTreeExpanded) {
												this.toggleTreeControl();
											}
										}.bind(this)
									);

									parseResolve();
								}.bind(this)
							);
						}.bind(this)
					);

					toolbarParsedData = new ToolbarParser({
						xml: viewControls.ownerPanel.getSharedData('configurableUIData'),
						viewmodel: structuredDocument,
						aras: this.aras,
						toolbarContainerName: 'HtmlRichTextEditor',
						presentationConfigurationId: tdfSettings.presentationConfigurationId
					});
					toolbar = new TechDocHtmlToolbar({
						id: 'toolbar',
						connectId: 'toolbarContainer',
						toolbarObj: toolbarParsedData,
						structuredDocument: structuredDocument,
						additionalData: {
							documentViewSettings: documentViewSettings,
							isPrimary: panelViewSettings.isPrimaryView
						}
					});

					toolbar.startup();
					toolbarDomNode = toolbar.getCurrentToolBarDomNode_Experimental();

					searchControl = new SearchComponent({
						containerNode: toolbarDomNode,
						searchSource: structuredDocument,
						searchEngine: new TextSearchEngine(),
						collapseOnSpaceLack: true,
						resourceStrings: {
							placeholderText: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.placeholderText'
							),
							prevButtonTitle: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.prevButtonTitle'
							),
							nextButtonTitle: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.nextButtonTitle'
							),
							toggleButtonTitle: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.toggleButtonTitle'
							),
							toggleButtonActiveTitle: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.toggleButtonActiveTitle'
							),
							noMatchesLabel: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.noMatchesLabel'
							),
							notEnoughSpaceAlert: this.getResourceString(
								'../Modules/aras.innovator.TDF',
								'search.notEnoughSpaceAlert'
							)
						}
					});

					aspect.after(
						structuredDocument,
						'onSelectionChanged',
						function () {
							searchControl.adjustControlPlacement();
						},
						true
					);

					viewControls.searchControl = searchControl;

					var treeGridAdapter = new TreeGridAdapter({
						connectId: 'techDocTree',
						viewModel: structuredDocument,
						aras: this.aras
					});

					viewControls.treeGridAdapter = treeGridAdapter;

					optionalContentHelper = structuredDocument.OptionalContent();
					optionalContentHelper.addEventListener(
						window,
						null,
						'onDisplayChanged',
						function (displayType) {
							if (!this.isViewSettingUp) {
								var viewSettings = this.viewContext.data.panelViewSettings;
								var isFiltrationHidden =
									viewSettings.filteredContentView == 'hidden';

								if (isFiltrationHidden && searchControl.isSearchActive()) {
									searchControl.runSearch();
								}
							}
						}.bind(this)
					);

					aspect.before(
						structuredDocument,
						'OnInvalidate',
						function (sender, earg) {
							var isItemChange = earg.invalidationList.length != 0;

							if (isItemChange) {
								var currentLanguage = structuredDocument.CurrentLanguageCode();
								var currentDomXml = structuredDocument.origin.ownerDocument.xml;

								if (
									structuredDocument.IsEqualEditableLevel(
										Enums.EditLevels.IgnoreExternal
									)
								) {
									var savedDomXml = structuredDocument.getSavedDocumentXml(
										currentLanguage
									);

									var oldContent = structuredDocument.removeGeneratedContentNode(
										savedDomXml
									);
									var newContent = structuredDocument.removeGeneratedContentNode(
										currentDomXml
									);

									// comparing only old and new content nodes, this will prevent from setting "isDirty" attribute if
									// only refences were updated during reload event
									if (
										oldContent.length !== newContent.length ||
										oldContent !== newContent
									) {
										var structureDocumentItem = structuredDocument.getDocumentItem();

										structuredDocument.saveDocumentXml(
											currentDomXml,
											currentLanguage
										);
										searchControl.cleanupResults();

										if (!this.aras.isDirtyEx(structureDocumentItem)) {
											structureDocumentItem.setAttribute('isDirty', '1');
											structureDocumentItem.setAttribute('action', 'update');

											if (this.viewContext.topWindow.updateItemsGrid) {
												this.viewContext.topWindow.updateItemsGrid(
													structureDocumentItem
												);
											}
										}
									}
								}

								var customEvent = document.createEvent('Event');
								customEvent.initEvent('change:item', true, true);
								window.dispatchEvent(customEvent);
							}
						}.bind(this),
						true
					);

					parsePromise
						.then(
							function () {
								editorControl.setSearchControl(searchControl);

								this.registerViewShortcuts();
								this.attachContextMenuEventHanlers();
								this.attachViewControllerEventHandlers();
								this.setupViewDisplayType(panelViewSettings.displayType);
							}.bind(this)
						)
						.then(function () {
							return structuredDocument.getStatePromise('initComplete');
						})
						.then(
							function () {
								this.attachActivationEventHandlers();

								document.body.classList.add('viewLoaded');
								this.isUIControlsCreated = true;
								layoutHtmlContainer();

								resolve();
							}.bind(this)
						);
				}.bind(this));
			}.bind(this)
		);
	};

	container.registerViewShortcuts = function () {
		var searchControl = this.viewContext.controls.searchControl;

		// ctrl+f shortcut registration
		this.aras.shortcutsHelperFactory.getInstance(window).subscribe(
			{
				shortcut: 'ctrl+f',
				preventBlur: true,
				useCapture: true,
				handler: function () {
					if (!searchControl.isActive()) {
						searchControl.setActiveState(true);

						setTimeout(function () {
							searchControl.focus();
						}, 200);
					} else {
						searchControl.focus();
					}
				},
				context: window
			},
			true
		);
	};

	container.activatePanel = function () {
		const ownerPanel = this.viewContext.controls.ownerPanel;
		return ownerPanel.activate();
	};

	container.attachActivationEventHandlers = function () {
		var editorControl = this.viewContext.controls.editorControl;
		var xmlFrameControl = this.viewContext.controls.xmlContentFrame;

		document.addEventListener('click', this.activatePanel.bind(this));
		document.addEventListener('focusin', this.activatePanel.bind(this));

		editorControl.iframe.contentDocument.addEventListener(
			'focusin',
			this.activatePanel.bind(this)
		);

		xmlFrameControl.addEventListener('load', function () {
			xmlFrameControl.contentDocument.addEventListener(
				'mousedown',
				this.activatePanel.bind(this)
			);
		});
	};

	container.attachViewControllerEventHandlers = function () {
		var ownerPanel = this.viewContext.controls.ownerPanel;
		var viewController = ownerPanel.viewController;

		viewController.addEventListener(
			window,
			null,
			'onPanelActivated',
			function (targetPanel) {
				if (targetPanel === ownerPanel) {
					this.setViewActiveState(true);
				}
			}.bind(this)
		);

		viewController.addEventListener(
			window,
			null,
			'onPanelDeactivated',
			function (targetPanel) {
				if (targetPanel === ownerPanel) {
					this.setViewActiveState(false);
				}
			}.bind(this)
		);
	};

	container.attachContextMenuEventHanlers = function () {
		var xmlFrameControl = this.viewContext.controls.xmlContentFrame;

		document.addEventListener('contextmenu', function (menuEvent) {
			menuEvent.preventDefault();
			menuEvent.stopPropagation();
		});

		xmlFrameControl.addEventListener('load', function () {
			xmlFrameControl.contentDocument.addEventListener('contextmenu', function (
				menuEvent
			) {
				menuEvent.preventDefault();
				menuEvent.stopPropagation();
			});
		});
	};

	container.setViewActiveState = function (isFocused) {
		var headerControls = this.viewContext.controls.headerControls;
		var viewData = this.viewContext.data;

		if (viewData.isPanelActive !== isFocused) {
			viewData.isPanelActive = isFocused;

			if (isFocused) {
				var ownerPanel = this.viewContext.controls.ownerPanel;

				headerControls.headerContainer.classList.add('active');
				ownerPanel.raiseEvent(
					'onPanelActivated',
					ownerPanel,
					this.viewContext.data.panelViewSettings
				);
			} else {
				headerControls.headerContainer.classList.remove('active');
			}
		}
	};

	container.GetContentPartFromXml = function (documentXml) {
		var contentNodeXPath = 'aras:document/aras:content';
		var contentNode;

		if (typeof documentXml == 'string') {
			var tempDocument = new XmlDocument();

			tempDocument.preserveWhiteSpace = true;
			tempDocument.loadXML(documentXml);

			if (dojo.isIE || this.aras.Browser.isIe()) {
				tempDocument.setProperty(
					'SelectionNamespaces',
					'xmlns:aras="http://aras.com/ArasTechDoc"'
				);
			} else {
				tempDocument.documentElement.setAttribute(
					'xmlns:aras',
					'http://aras.com/ArasTechDoc'
				);
			}
			contentNode = tempDocument.selectSingleNode(contentNodeXPath);
		} else if (typeof documentXml == 'object') {
			contentNode = documentXml.selectSingleNode(contentNodeXPath);
		}

		return contentNode.xml || '';
	};
}
