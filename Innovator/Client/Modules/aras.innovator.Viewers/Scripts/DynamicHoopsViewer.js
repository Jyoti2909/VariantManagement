VC.Utils.Page.LoadModules(['HoopsViewerBase', 'ViewerSpinner']);

require([
	'dojo/aspect',
	'dijit/layout/BorderContainer',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'../Scripts/3rdPartyLibs/pako/pako.min.js'
], function (aspect, BorderContainer, declare, lang, pako) {
	return dojo.setObject(
		'VC.DynamicHoopsViewer',
		(function () {
			var defaultResolution = 'Current';
			return declare('DynamicHoopsViewer', VC.HoopsViewerBase, {
				isStarted: false,
				isSelectionFromTree: false,
				modelXml: '',
				isModelStructureReady: false,
				resetViewInProgress: false,
				pathNodeDictionary: null,
				onShowSidebarViewerButton: function () {},
				onApplyViewStateData: null,
				isFirstOpen: true,
				isModelReadyForSelection: false,
				tgv_parameters: null,
				spinner: null,
				viewModesMap: {},
				communicatorColors: {},
				modelColorsMap: {},
				loadSubtreeConfig: null,
				defaultViewMode: 'Default',
				viewStateRestoringInProgress: false,
				savedViewStateData: null,
				scsFileLoadingFailed: false,
				fileByteArraysMap: {},
				zoomToCursorPropertyName: 'zoom_to_cursor_for_dynamic',

				constructor: function (args) {
					this.type = 'dynamic';
					this.spinner = new VC.ViewerSpinner();
					this.spinner.onAfterShowViewerSpinner = this.setViewerControlsAccessibility.bind(
						this,
						false
					);
					this.spinner.onAfterHideViewerSpinner = this.setViewerControlsAccessibility.bind(
						this,
						true
					);
					this.savedViewStateData = new this.ViewState();
				},

				setViewerCallbacks: function () {
					var self = this;

					this.viewer.setCallbacks({
						modelStructureParseBegin: function () {
							self.setLoadingProgress(25);
						},

						modelStructureReady: function () {
							self.modelStructureReadyHandler();
						},

						selectionArray: function (selectionEvents) {
							if (self.isModelReadyForSelection) {
								var selectionEvent =
									selectionEvents && selectionEvents[0]
										? selectionEvents[0]
										: null;

								// "Orient To Face" button's state depends on the current selection's type
								self.setBtnOrientToFaceAccessibility(selectionEvent);

								if (!self.isSelectionFromTree) {
									// get path to selected model and select related node in the tree
									if (
										VC.Utils.isNotNullOrUndefined(selectionEvent) &&
										self.isTgvSynchronizationAvailable()
									) {
										var selection = selectionEvent.getSelection();
										self.prepareOnSelectItemOnModel(selection.getNodeId());
									}
								}
							}
						},

						measurementCreated: function (measurement) {
							var measureDialog = self.DialogManager.getExistingDialog(
								VC.Utils.Enums.Dialogs.Measure
							);

							if (measureDialog) {
								measureDialog.btnDeleteAll.Enable();
							}
						}
					});
				},

				onAfterShowModelBrowserHandler: function () {
					this.forceTgvSelection();

					return this.inherited(arguments);
				},

				forceTgvSelection: function () {
					if (
						this.isTgvSynchronizationAvailable() &&
						this.viewer &&
						this.viewer.selectionManager
					) {
						var last = this.viewer.selectionManager.getLast();
						var nodeId = last && last.getNodeId();
						if (nodeId !== undefined && nodeId !== null) {
							this.prepareOnSelectItemOnModel(nodeId);
						}
					}
				},

				isTgvSynchronizationAvailable: function () {
					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					const returnedValue =
						modelBrowserPanel.isOpened && modelBrowserPanel.modelTab.isActive;

					return returnedValue;
				},

				isToSkipModelLoading: function () {
					if (this.viewStateRestoringInProgress) {
						return false;
					}

					const execQueryOnOpeningViewer = this.aras.getPreferenceItemProperty(
						'SSVC_Preferences',
						null,
						'execute_query_on_opening_viewer'
					);
					return execQueryOnOpeningViewer === '1' &&
						this.mode != this.ViewerModes.Markup
						? false
						: this.isFirstOpen;
				},

				prepareOnSelectItemOnModel: function (nodeId) {
					var self = this;
					var resultCallback = function (parentNodeIds) {
						if (parentNodeIds && parentNodeIds !== '') {
							self.onSelectItemOnModel(parentNodeIds);
						}
					};
					self.getParentsPath(nodeId, resultCallback);
				},

				getParentsPath: function (nodeId, resultCallback) {
					var self = this;
					return new Promise(function (resolve) {
						var promises = [];
						var parentNodeIds = [];
						self.getItemPropertiesFromModel(
							nodeId,
							parentNodeIds,
							self.generateParentsPath.bind(self),
							promises,
							resultCallback
						);
						resolve(parentNodeIds.join('/'));
					});
				},

				generateParentsPath: function (
					props,
					parentNodeIds,
					promises,
					resultCallback
				) {
					if (props.itemId !== null && props.queryItemRefId !== null) {
						parentNodeIds.unshift(props.queryItemRefId + ':' + props.itemId);
					}
					var parentId = this.viewer
						.getModel()
						.getNodeParent(props.modelNodeId);
					if (parentId !== null) {
						this.getItemPropertiesFromModel(
							parentId,
							parentNodeIds,
							this.generateParentsPath.bind(this),
							promises,
							resultCallback
						);
					} else {
						Promise.all(promises).then(function (resolve) {
							var result = new Promise(function (resolve) {
								resolve(parentNodeIds.join('/'));
								resultCallback(parentNodeIds.join('/'));
							});
						});
					}
				},

				getItemPropertiesFromModel: function (
					nodeId,
					parentNodeIds,
					generateParentsPath,
					promises,
					resultCallback
				) {
					var self = this;

					if (VC.Utils.isNotNullOrUndefined(nodeId)) {
						var model = this.viewer.getModel();

						var promise = model
							.getNodeProperties(nodeId)
							.then(function (nodeProperties) {
								if (nodeProperties) {
									var properties = self.getProperties(nodeId, nodeProperties);

									if (generateParentsPath) {
										generateParentsPath(
											properties,
											parentNodeIds,
											promises,
											resultCallback
										);
									}
								}
							});

						promises.push(promise);
					}
				},

				getProperties: function (nodeId, nodeProperties) {
					var queryItemRefIdPropertyName = 'QUERY ITEM REF ID';
					var itemIdPropertyName = 'ITEM ID';
					var properties = {
						modelNodeId: nodeId,
						queryItemRefId: null,
						itemId: null
					};

					if (nodeProperties.hasOwnProperty(queryItemRefIdPropertyName)) {
						properties.queryItemRefId =
							nodeProperties[queryItemRefIdPropertyName];
					}

					if (nodeProperties.hasOwnProperty(itemIdPropertyName)) {
						properties.itemId = nodeProperties[itemIdPropertyName];
					}

					return properties;
				},

				modelStructureReadyHandler: function () {
					this.isModelStructureReady = true;
					this.onViewerLoaded();
					this.createAxisTriad();

					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					modelBrowserPanel.viewsTab.isSavedViewsSupported = true;
					modelBrowserPanel.viewsTab.loadViews();

					this.setLoadingProgress(101);
				},

				displayToolbarButtons: function (flag) {},

				afterSubtreeLoadedHandler: function () {
					var orbitOperator = this.viewer
						.getOperatorManager()
						.getOperator(Communicator.OperatorId.Orbit);
					orbitOperator.setOrbitFallbackMode(
						Communicator.OrbitFallbackMode.ModelCenter
					);
				},

				initializeViewer: function (args) {
					try {
						this.viewer = new Communicator.WebViewer({
							containerId: 'viewerContainer',
							streamingMode: Communicator.StreamingMode.OnDemand,
							boundingPreviewMode: Communicator.BoundingPreviewMode.None,
							empty: true
						});
						this.viewer.start();
						this.isStarted = true;
						this.setViewerCallbacks();
						this.initSplitter();

						VC.Utils.Page.LoadModules(['Controls/CuttingPlaneControl']);
						this.cuttingPlaneControl = new VC.Widgets.CuttingPlaneControl(
							new Communicator.Ui.CuttingPlaneController(this.viewer)
						);
						this.setZoomToMousePositionFromDatabase(
							this.zoomToCursorPropertyName
						);

						this.loadSubtreeConfig = new Communicator.LoadSubtreeConfig();
						this.loadSubtreeConfig.implicitlyLoadXmlExternalModels = false;

						this.isViewerInitialized = true;
					} catch (ex) {
						console.error(ex);
						VC.Utils.AlertError(ex.message, ex.message, ex.stack);
					}
				},

				_toMarkupMode: function () {
					this.showSnapshot();
					this.hideViewer();
					this.DialogManager.closeAllDialogsButThis(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					if (this.toolbarContainer.viewToolbar) {
						this.toolbarContainer.btnMarkup.select();
						this.toolbarContainer.activeMode = this.mode;
						this.toolbarContainer.viewToolbar.hide();
					}

					if (this.onMarkupModeActivate) {
						this.onMarkupModeActivate();
					}
				},

				clearViewState: function (viewStateData) {
					if (!viewStateData.isEmpty()) {
						viewStateData.innerString = '<view_state></view_state>';
					}
				},

				setModelSelectionSettings: function (isSelected) {
					this.isModelReadyForSelection = isSelected;
					this.viewer.selectionManager.setHighlightNodeSelection(isSelected);
					this.viewer.selectionManager.setHighlightFaceElementSelection(
						isSelected
					);
					this.viewer.selectionManager.setHighlightLineElementSelection(
						isSelected
					);
				},

				loadShatteredModel: function () {
					try {
						let self = this;
						this.spinner.showViewerSpinner(this.viewerContainer);
						this.setModelSelectionSettings(false);
						this.viewModesMap = {};
						this.modelColorsMap = {};
						this.modelXml = '';

						var inn = this.aras.newIOMInnovator();
						var method = this.getMethodItemString();

						var inDom = inn.newXMLDocument();
						inDom.loadXML(method);

						this.aras.IomInnovator.getItemInDom(inDom)
							.applyAsync()
							.then(
								function (results) {
									var resultModelXml = this.getCompressedProperty(
										results,
										'ModelXml'
									);

									if (VC.Utils.isNullOrUndefined(resultModelXml)) {
										this.modelXml = results.getResult();
									} else {
										this.modelXml = resultModelXml;

										const fileUrlsMap = this.getCompressedProperty(
											results,
											'FileUrlsMap'
										);

										if (fileUrlsMap) {
											this.urlMap = JSON.parse(fileUrlsMap);
										}

										const syncPathMap = this.getCompressedProperty(
											results,
											'SyncPathMap'
										);

										if (syncPathMap) {
											this.pathNodeDictionary = JSON.parse(syncPathMap);
										}

										var resultItemVisualizationMap = results.getProperty(
											'RenderingMap'
										);
										if (
											VC.Utils.isNotNullOrUndefined(resultItemVisualizationMap)
										) {
											var visualizationMap = JSON.parse(
												resultItemVisualizationMap
											);
											if (
												visualizationMap &&
												visualizationMap.hasOwnProperty('RenderingMapList')
											) {
												this.viewModesMap = visualizationMap.RenderingMapList;
											}
										}

										this.fillViewModes();
									}

									if (this.modelXml !== '') {
										this.loadSubtreeFromXML();
									} else {
										self.viewStateRestoringInProgress = false;
										self.spinner.hideViewerSpinner(this.viewerContainer);
									}
								}.bind(this)
							)
							.catch(function (soapResponse) {
								self.viewStateRestoringInProgress = false;
								self.spinner.hideViewerSpinner(this.viewerContainer);
								self.setModelSelectionSettings(false);

								const errorItem = self.aras.newIOMItem();
								errorItem.loadAML(soapResponse.responseText);
								const errorDetails = errorItem.getErrorDetail();
								console.error(errorDetails);

								VC.Utils.AlertError(
									VC.Utils.GetResource('err_server_side'),
									errorItem.getErrorString(),
									errorDetails,
									null
								);
							});
					} catch (ex) {
						this.viewStateRestoringInProgress = false;
						this.spinner.hideViewerSpinner(this.viewerContainer);
						console.error(ex);
						VC.Utils.AlertError(ex.message, ex.message, ex.stack);
					}
				},

				getItemIds: function () {
					const extraModelIds = this.onGetExtraModelIds();
					const rootItemId = this.getItemData().itemId;

					return extraModelIds && extraModelIds.length > 0
						? rootItemId.concat(',', extraModelIds.toString())
						: rootItemId;
				},

				getMethodItemString: function () {
					var methodTemplate =
						"<Item type='Method' action='CreateModelXml'>" +
						'<dynamicViewDefinitionId>{0}</dynamicViewDefinitionId>' +
						'<tgvDefId>{1}</tgvDefId>' +
						'<itemId>{2}</itemId>' +
						'<qbParamValueByName>{3}</qbParamValueByName>' +
						'</Item>';

					var dvdId = this.args.dvdId;
					var tgvdId = this.args.tgvdId;
					var method = methodTemplate.Format(
						dvdId,
						tgvdId,
						this.getItemIds(),
						this.aras.escapeXMLAttribute(this.tgv_parameters)
					);

					return method;
				},

				getXmlByXPath: function (xmlDocument, xpathExpression) {
					var xmlNode = xmlDocument.selectSingleNode(xpathExpression);
					return xmlNode !== null ? xmlNode.innerHTML : '';
				},

				loadSubtreeFromXML: function () {
					try {
						var self = this;
						var model = this.viewer.getModel();
						var rootNodeID = model.getAbsoluteRootNode();

						// After model is loaded used 'resetView' function as workaround,
						// because cutting planes are display too small
						model
							.loadSubtreeFromScsXmlBuffer(
								rootNodeID,
								this.modelXml,
								this.getFileBufferByFileId.bind(this),
								this.loadSubtreeConfig
							)
							.then(function () {
								self.viewer
									.getModel()
									.requestNodes([rootNodeID])
									.finally(function () {
										if (self.viewStateRestoringInProgress) {
											self.restoreViewStateData(self.savedViewStateData);
										} else {
											self.restoreViewStateData(self.viewStateData);
										}
										self.spinner.hideViewerSpinner(self.viewerContainer);
										self.setModelSelectionSettings(true);

										var ddViewModes =
											self.toolbarContainer.viewToolbar.ddViewModes;
										if (
											ddViewModes &&
											Object.keys(self.viewModesMap).length > 0
										) {
											ddViewModes.Enable();
										}
										self.viewStateRestoringInProgress = false;
									})
									.catch(function (ex) {
										console.error(ex);
										self.viewStateRestoringInProgress = false;
										VC.Utils.AlertError(ex.message, ex.message, ex.stack);
									});
							})
							//Add 'catch' block with duplication call of 'toggle Spinner' function, as 'finally' block wasn't work in IE 11
							.catch(function (ex) {
								self.viewStateRestoringInProgress = false;
								self.spinner.hideViewerSpinner(self.viewerContainer);
								console.error(ex);
								VC.Utils.AlertError(ex.message, ex.message, ex.stack);
							});
						this.setBtnExplodedViewAccessibility();
					} catch (ex) {
						this.viewStateRestoringInProgress = false;
						this.spinner.hideViewerSpinner(this.viewerContainer);
						console.error(ex);
						VC.Utils.AlertError(ex.message, ex.message, ex.stack);
					}
				},

				getFileBufferByFileId: function (fileId) {
					let result = null;
					const self = this;

					if (fileId) {
						try {
							let fileUrl = this.urlMap[fileId];

							if (fileUrl) {
								if (fileId in this.fileByteArraysMap) {
									return this.fileByteArraysMap[fileId];
								}

								let _xmlHttpRequest = this.aras.XmlHttpRequestManager.CreateRequest();
								_xmlHttpRequest.open('GET', fileUrl, true);
								_xmlHttpRequest.responseType = 'arraybuffer';

								let authHeader = this.aras.OAuthClient.getAuthorizationHeader();
								_xmlHttpRequest.setRequestHeader(
									'Authorization',
									authHeader.Authorization
								);

								result = new Promise(function (resolve) {
									_xmlHttpRequest.onreadystatechange = function () {
										if (
											this.readyState ===
												VC.Utils.Enums.XMLHttpRequest.readyState.done &&
											this.status === VC.Utils.Enums.XMLHttpRequest.status.ok
										) {
											let arrayBuffer = this.response;

											if (arrayBuffer) {
												const byteArray = new Uint8Array(arrayBuffer);
												resolve(byteArray);
											}
										} else if (
											this.readyState ===
											VC.Utils.Enums.XMLHttpRequest.readyState.done
										) {
											resolve(null);

											if (!self.scsFileLoadingFailed) {
												self.scsFileLoadingFailed = true;
												VC.Utils.AlertError(
													VC.Utils.GetResource(
														'scsFileLoadingFailedError'
													).Format(this.status),
													'XMLHttpRequest failed to GET "{0}" with status {1}.'.Format(
														fileUrl,
														this.status
													)
												);
											}
										}
									};
									_xmlHttpRequest.send();
								});

								this.fileByteArraysMap[fileId] = result;
							}
						} catch (ex) {
							console.error(ex);
						}
					}

					return result;
				},

				getItemData: function () {
					var returnedValue = {};

					if (
						!this.args ||
						!this.args.markupHolderId ||
						!this.args.markupHolderItemtypeName
					) {
						throw new Error(
							'Item id or item type name are not specified for the hoops viewer'
						);
					}

					returnedValue.itemId = this.args.markupHolderId;
					returnedValue.itemTypeName = this.args.markupHolderItemtypeName;

					return returnedValue;
				},

				setBtnExplodedViewAccessibility: function () {
					if (this.viewerToolbar.btnExplodedView) {
						if (
							VC.Utils.isNullOrUndefined(this.modelXml) ||
							this.modelXml === ''
						) {
							this.viewerToolbar.btnExplodedView.Disable();
						}

						var xmlDocument = VC.Utils.createXMLDocument();
						xmlDocument.loadXML(this.modelXml);

						var productOccurences = xmlDocument.getElementsByTagName(
							'ProductOccurence'
						);
						//assembly contains more than 3 'productOccurences'
						var minLength = 3;
						if (productOccurences.length > minLength) {
							this.viewerToolbar.btnExplodedView.Enable();
						} else {
							this.viewerToolbar.btnExplodedView.Disable();
						}
					}
				},

				crossSectionClick: function () {
					var self = this;

					var crossSectionArgs = {
						cappingGeometryState: this.viewer
							.getCuttingManager()
							.getCappingGeometryVisibility()
					};

					var crossSectionDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.CrossSection,
						crossSectionArgs
					);

					if (!crossSectionDialog.isInitHandlers) {
						crossSectionDialog.onResetCuttingPlanes = function () {
							self.cuttingPlaneControl.resetCuttingPlanes();
						};

						this.crossSectionInitHandlers(crossSectionDialog);
					}

					self.viewer.getCuttingManager().activateCuttingSections();
				},

				resetView: function () {
					if (this.resetViewInProgress) {
						return;
					}
					this.resetViewInProgress = true;

					var self = this;

					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes) {
						ddViewModes.setSelectedValue(this.defaultViewMode);
					}

					this.resetViewBase(VC.Utils.Enums.Dialogs.DynamicModelBrowser);

					this.viewer.reset().then(function () {
						self.resetViewInProgress = false;
					});

					// Switch to the initial view of component geometry from activated CAD View
					var handleOperator = this.viewer
						.getOperatorManager()
						.getOperator(Communicator.OperatorId.Handle);
					handleOperator.removeHandles();
				},

				requestNodes: function (nodeIds) {
					this.viewer.getModel().requestNodes(nodeIds);
				},

				onViewerLoaded: function () {
					this.inherited(arguments);
					const bgColor = new Communicator.Color(255, 255, 255);

					this.disableMultiplePartSelection();
					var viewer = this.viewer.getView();
					viewer.setBackgroundColor(bgColor, bgColor);
					viewer.getHiddenLineSettings().setObscuredLineTransparency(0);

					this.DialogManager.openDialog(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
				},

				onSelectItemOnModel: function (pathsStr) {},

				onLoadWithParameters: function (qdParameters) {},

				onSetExtraModelIds: function (extraModelIds) {},

				onDisableTgvToolbar: function () {},

				onEnableTgvToolbar: function () {},

				onGetExtraModelIds: function () {},

				onSelectRowOnTgvTreeGrid: function (pathsStr) {
					if (this.isModelReadyForSelection) {
						var nodeIdsToSelect = this.pathNodeDictionary[pathsStr];
						if (nodeIdsToSelect) {
							this.isSelectionFromTree = true;
							nodeIdsToSelect = nodeIdsToSelect.map(Number);
							var selectionManager = this.viewer.selectionManager;
							selectionManager.clear();

							var selectionMode =
								nodeIdsToSelect.length > 0
									? Communicator.SelectionMode.Add
									: Communicator.SelectionMode.Set;
							nodeIdsToSelect.forEach(function (nodeId) {
								selectionManager.selectNode(nodeId, selectionMode);
							});
							this.isSelectionFromTree = false;
						}
					}
				},

				loadViewerToolbar: function () {
					var self = this;
					const showModelBrowserFunction = lang.partial(
						lang.hitch(self, self.showModelBrowser),
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.DynamicHoopsViewerToolbar
					);
					this.loadViewerToolbarBase();

					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnModelBrowserClick,
						showModelBrowserFunction
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnResetViewClick,
						lang.hitch(self, self.resetView)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.ddViewModes,
						lang.hitch(self, self.selectViewMode)
					);

					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnModelBrowser,
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					// "Exploded View" button should be initially disabled because there is no loaded model
					this.setBtnExplodedViewAccessibility();

					this.setDefaultViewModesValue();
				},

				setDefaultViewModesValue: function () {
					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes) {
						ddViewModes.addOption(
							this.defaultViewMode,
							this.defaultViewMode,
							true
						);
						ddViewModes.Disable();
					}
				},

				clearViewModes: function () {
					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes) {
						ddViewModes.removeAllOptionsButThis(this.defaultViewMode);
						ddViewModes.Disable();
					}
				},

				fillViewModes: function () {
					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes && this.viewModesMap) {
						var viewModeNames = Object.keys(this.viewModesMap);
						if (viewModeNames.length > 0) {
							viewModeNames.forEach(function (name) {
								ddViewModes.addOption(name, name, false);
							});
						}

						ddViewModes.Disable();
					}
				},

				loadContainer: function (args) {
					VC.Utils.Page.LoadModules(['Widgets/HoopsViewerContainer']);

					const tgvdId = args.tgvdId
						? args.tgvdId
						: '3A6AC1EA2B2C41E98670E837E8858A0B';
					var htmlContainer = new VC.Widgets.ViewerContainer();
					htmlContainer.placeAt(document.body);

					var modelBrowserPanelArgs = {
						tgvdId: tgvdId,
						rootItemId: args.markupHolderId
					};
					this.DialogManager.viewerType = this.type;
					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser,
						modelBrowserPanelArgs
					);

					this.initViewerContent(modelBrowserPanel, htmlContainer);

					return htmlContainer;
				},

				assignModelBrowserHandlers: function (modelBrowser) {
					modelBrowser.onAfterShow = this.onAfterShowModelBrowserHandler.bind(
						this,
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);

					modelBrowser.onAfterHide = this.onAfterHideModelBrowserHandler.bind(
						this,
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);

					modelBrowser.viewsTab.onGetCustomViews = this.getCustomViews.bind(
						this
					);

					modelBrowser.viewsTab.onGetSavedViews = this.getSavedViews.bind(this);

					modelBrowser.viewsTab.onCreateSavedView = this.addSavedViewClick.bind(
						this
					);

					modelBrowser.viewsTab.onDeleteSavedView = this.removeSavedViewClick.bind(
						this
					);

					modelBrowser.viewsTab.onSelectStandardView = this.onSelectStandardViewHandler.bind(
						this
					);

					modelBrowser.viewsTab.onSelectCustomView = this.onSelectCustomViewHandler.bind(
						this
					);

					modelBrowser.viewsTab.onSelectSavedView = this.loadSavedViewClick.bind(
						this
					);

					aspect.after(
						modelBrowser.modelTab,
						'setTabVisibility',
						this.forceTgvSelection.bind(this)
					);
				},

				onSelectStandardViewHandler: function (viewDirectionType) {
					this.setViewDirection(viewDirectionType, this.directionDuration);
				},

				onSelectCustomViewHandler: function (cadViewId) {
					this.applyCustomView(cadViewId);
				},

				initITContainer: function () {
					var self = this;

					this.loadViewerToolbar();
					this.loadMarkupToolbar();

					this.toolbarContainer.onBtnViewClick = function () {
						if (self.markupPage && self.markupPage.hasNotations()) {
							if (
								VC.Utils.confirm(
									VC.Utils.GetResource('mark_tb_lose_unsaved_markup'),
									window
								) !== true
							) {
								if (
									typeof self.ToolbarManager.currentContainer.btnView
										.isCancelled !== 'undefined'
								) {
									self.ToolbarManager.currentContainer.btnView.isCancelled = true;
								}

								return;
							}
						}
						if (self.mode === self.ViewerModes.Markup) {
							self.displayFile();
							self.refreshDialogWrap();
							if (self.DialogManager.needRestoreMeasureDialog) {
								self.toolbarContainer.viewToolbar.btnMeasure.onClick();
							}

							if (self.onApplyViewStateData) {
								self.onApplyViewStateData();
								self.onApplyViewStateData = null;
							}
						}
					};

					this.toolbarContainer.onBtnMarkupClick = function () {
						if (self.mode === self.ViewerModes.View) {
							self.refreshDialogWrap();
							self.getMarkupImg().then(function (image) {
								var existMeasurements = self.viewer
									.getMeasureManager()
									.getAllMeasurements().length;
								self.displayMarkup(image.src);
								self.DialogManager.needRestoreMeasureDialog =
									existMeasurements !== 0 ? true : false;
							});
							self.viewStateData.updateValue('dynamicTooltipTemplate', 'true');
							self.collectViewStateData(self.viewStateData);
						}
					};

					this.assignBasicToolbarSwitchClickHandler();
				},

				refresh3DView: function (qb_parameters_value_by_name) {
					this.tgv_parameters = qb_parameters_value_by_name;
					this.isFirstOpen = false;
					this.scsFileLoadingFailed = false;
					// fileByteArraysMap object is not recreated on refresh, because it contains data
					// for each fileId that is unique. So when new fileId is processed on refresh
					// (e.g. some CAD has been updated), just 1 new item will be added to fileByteArraysMap
					// instead of recreate object and add data for all fileIds again.
					//this.fileByteArraysMap = {};
					var crossSectionDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.CrossSection
					);
					if (crossSectionDialog) {
						crossSectionDialog.resetDialogContentState();
					}
					this.DialogManager.closeAllDialogsButThis(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					this.clearViewModes();
					this.recreateScene(this.loadModel.bind(this));
				},

				loadModel: function () {
					this.loadShatteredModel();
					this.measurementMarkup = null;
				},

				recreateScene: function (createSceneCallback) {
					this.viewer
						.getModel()
						.clear()
						.then(function () {
							if (createSceneCallback) {
								createSceneCallback();
							}
						});
				},

				getModelColorMap: function (viewModeName) {
					var newColorMap = {};
					var colorMap = this.viewModesMap[viewModeName].colorMap;
					for (var key in colorMap) {
						newColorMap[key] = this.getColorFromString(colorMap[key]);
					}
					return newColorMap;
				},

				getModelOpacityMap: function (viewModeName) {
					return this.viewModesMap[viewModeName].opacityMap;
				},

				assignBasicToolbarSwitchClickHandler: function () {
					var self = this;

					this.toolbarContainer.onBtnSwitchClick = function () {
						var containerTypeToSwitch = VC.Toolbar.ContainerTypeMapper.mapBasicToCommand();
						var currentContainer = self.ToolbarManager.currentContainer;
						if (
							containerTypeToSwitch ===
							VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
								.TBasicContainer
						) {
							var ddViewModes = self.toolbarContainer.viewToolbar.ddViewModes;
							if (ddViewModes) {
								ddViewModes.setSelectedValue(self.defaultViewMode);
								self.setViewMode(self.defaultViewMode);
							}
							self.switchToDefaultMode();
						}

						self.ToolbarManager.showITContainer(containerTypeToSwitch);

						if (
							!self.ToolbarManager.currentContainer.viewToolbar ||
							!self.ToolbarManager.currentContainer.markupToolbar
						) {
							self.initITContainer();
						}

						currentContainer.assignElementStatesTo(
							self.ToolbarManager.currentContainer
						);
						self.ToolbarManager.currentContainer.refresh();
						currentContainer.refresh();
						currentContainer.closeAllPalettesButThis('');
						self._saveContainerTypeToInnovator(containerTypeToSwitch);
						if (self.OnLoaded) {
							self.OnLoaded();
						}
					};

					aspect.after(
						this.toolbarContainer,
						'onBtnSwitchClick',
						lang.hitch(this, function () {
							if (
								this.toolbarContainer.markupToolbar &&
								this.mode === this.ViewerModes.Markup
							) {
								this.restoreMarkupActivePalette();
							} else {
								// "Orient To Face" button's state depends on the selection made when Basic Toolbar was active
								this.setBtnOrientToFaceAccessibility();
							}
						})
					);
				},

				selectViewMode: function () {
					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes) {
						var selectedViewMode = ddViewModes.selectedItem;
						this.setViewMode(selectedViewMode);
					}
				},

				setViewMode: function (viewMode) {
					var self = this;

					this.viewer
						.getModel()
						.resetNodesColor()
						.then(function () {
							self.viewer.getModel().resetModelOpacity();
							if (viewMode !== self.defaultViewMode) {
								var colorMap = self.getColorMap(viewMode);
								var opacityMap = self.getModelOpacityMap(viewMode);

								try {
									self.viewer.view._engine._sc.setTransparencyMode(0);
								} catch (err) {
									console.warn(err);
									VC.Utils.AlertWarning(
										VC.Utils.GetResource('sortedTransparencyModeWarning')
									);
								}

								self.viewer.getModel().setNodesColors(colorMap);
								self.viewer.getModel().setNodesOpacities(opacityMap);
							}
						});
				},

				getColorMap: function (viewMode) {
					var colorMap = this.modelColorsMap[viewMode];

					if (VC.Utils.isNullOrUndefined(colorMap)) {
						colorMap = this.getModelColorMap(viewMode);
						this.modelColorsMap[viewMode] = colorMap;
					}

					return colorMap;
				},

				getColorFromString: function (nodeColor) {
					var color = this.communicatorColors[nodeColor];

					if (VC.Utils.isNullOrUndefined(color)) {
						color = this.getCommunicatorColor(nodeColor);
						this.communicatorColors[nodeColor] = color;
					}
					return color;
				},

				getCommunicatorColor: function (nodeColor) {
					var rgb = nodeColor.split(';');
					return new Communicator.Color(rgb[0], rgb[1], rgb[2]);
				},

				getSavedViews: function () {
					var itemData = this.getItemData();
					var dvdId = this.args.dvdId;
					var configId = this.aras.getItemProperty(parent.item, 'config_id');

					var targetItem = this.aras.newIOMItem(itemData.itemTypeName, 'get');
					targetItem.setAttribute('select', 'id');
					targetItem.setProperty('config_id', configId);
					var savedViewItems = this.aras.newIOMItem('SavedView', 'get');
					savedViewItems.setAttribute('select', 'name');
					savedViewItems.setAttribute('orderBy', 'name');
					savedViewItems.setProperty('dvd_id', dvdId);
					savedViewItems.setPropertyItem('target_item', targetItem);
					savedViewItems = savedViewItems.apply();

					var itemCount = savedViewItems.getItemCount();
					var savedViews = [];
					if (itemCount > 0) {
						for (var i = 0; i < itemCount; i++) {
							var savedViewItem = savedViewItems.getItemByIndex(i);

							var savedView = {};
							savedView.id = savedViewItem.getId();
							savedView.label = savedViewItem.getProperty('name');
							savedView.viewType = 'savedViews';
							savedViews.push(savedView);
						}
					}
					return savedViews;
				},

				collectViewStateData: function (viewStateData) {
					var cameraString = JSON.stringify(
						this.viewer.getView().getCamera().toJson()
					);
					viewStateData.updateValue('camera', cameraString);
					viewStateData.updateValue('qdParameters', this.tgv_parameters);

					const extraModelIds = this.onGetExtraModelIds();
					if (extraModelIds.length > 0) {
						viewStateData.updateValue(
							'extraModelIds',
							JSON.stringify(extraModelIds)
						);
					}

					var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
					if (ddViewModes) {
						var selectedViewMode = ddViewModes.selectedItem;
						if (selectedViewMode !== this.defaultViewMode) {
							viewStateData.updateValue('viewMode', selectedViewMode);
						}
					}
				},

				createSavedViewItem: function (itemId, itemType, dvdId, savedViewName) {
					var targetItem = this.aras.newIOMItem(itemType, 'get');
					targetItem.setID(itemId);

					this.clearViewState(this.savedViewStateData);
					this.collectViewStateData(this.savedViewStateData);

					var savedViewItem = this.aras.newIOMItem('SavedView', 'add');
					savedViewItem.setPropertyItem('target_item', targetItem);
					savedViewItem.setProperty('dvd_id', dvdId);
					savedViewItem.setProperty('name', savedViewName);
					savedViewItem.setProperty(
						'view_data',
						this.savedViewStateData.innerString
					);
					savedViewItem.setAttribute('doGetItem', '0');
					savedViewItem = savedViewItem.apply();

					if (!savedViewItem.isError()) {
						return savedViewItem.getId();
					} else {
						VC.Utils.AlertError(savedViewItem.getErrorString());
					}

					return 0;
				},

				addSavedViewClick: function () {
					var self = this;
					var createDialogTitle = VC.Utils.GetResource('createDialogTitle');
					var createDialogLabel = VC.Utils.GetResource('createDialogLabel');
					var createDialogOption = {
						title: createDialogTitle,
						required: true,
						pattern: '^[\\w][\\w ]{0,31}'
					};
					var createDialog = new ArasModules.Dialog.prompt(
						createDialogLabel,
						createDialogOption
					);
					createDialog.then(function (dialogResult) {
						if (VC.Utils.isNotNullOrUndefined(dialogResult)) {
							self.addSavedView(dialogResult);
						}
					});
				},

				addSavedView: function (name) {
					var itemData = this.getItemData();
					var savedViewId = this.createSavedViewItem(
						itemData.itemId,
						itemData.itemTypeName,
						this.args.dvdId,
						name
					);

					if (savedViewId !== 0) {
						var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
							VC.Utils.Enums.Dialogs.DynamicModelBrowser
						);
						modelBrowserPanel.viewsTab.addSavedView(savedViewId, name);
					}
				},

				removeSavedViewClick: function (id, name) {
					var self = this;

					var deleteDialogTitle = VC.Utils.GetResource('deleteDialogTitle');
					var deleteButtonText = VC.Utils.GetResource(
						'deleteDialogDeleteBtnLabel'
					);
					var deleteDialogMessage = VC.Utils.GetResource(
						'deleteDialogMessage'
					).Format(name);

					var images = {
						delete: '../images/Delete.svg'
					};
					ArasModules.SvgManager.enqueue(Object.values(images));

					var deleteDialogOption = {
						okButtonText: deleteButtonText,
						title: deleteDialogTitle,
						image: images.delete
					};
					var deleteDialog = new ArasModules.Dialog.confirm(
						deleteDialogMessage,
						deleteDialogOption
					);

					deleteDialog.then(function (dialogResult) {
						if (dialogResult === 'ok') {
							self.deleteSavedViewItem(id);
						}
					});
				},

				deleteSavedViewItem: function (savedViewId) {
					var savedViewItem = this.aras.newIOMItem('SavedView', 'delete');
					savedViewItem.setID(savedViewId);
					savedViewItem = savedViewItem.apply();

					if (!savedViewItem.isError()) {
						var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
							VC.Utils.Enums.Dialogs.DynamicModelBrowser
						);
						modelBrowserPanel.viewsTab.deleteSavedView(savedViewId);
					}
				},

				getSelectedSavedViewData: function (id) {
					var savedViewItem = this.aras.newIOMItem('SavedView', 'get');
					savedViewItem.setID(id);
					savedViewItem = savedViewItem.apply();

					if (!savedViewItem.isError()) {
						return savedViewItem.getProperty('view_data');
					} else {
						this.viewStateRestoringInProgress = false;
						VC.Utils.AlertError(savedViewItem.getErrorString());
					}
				},

				loadSavedViewClick: function (savedViewId) {
					if (this.isModelLoading() || this.viewStateRestoringInProgress) {
						return;
					}

					this.viewStateRestoringInProgress = true;

					const savedViewData = this.getSelectedSavedViewData(savedViewId);

					if (savedViewData) {
						this.savedViewStateData.innerString = savedViewData;
						this.restoreDynamicView(this.savedViewStateData);
					}
				},

				applyViewStateData: function () {
					if (!this.viewer || this.viewStateData.isEmpty()) {
						return;
					}

					this.restoreDynamicView(this.viewStateData);
				},

				restoreViewStateData: function (viewStateData) {
					var self = this;
					this.restoreViewMode(viewStateData);
					// used 'viewer.reset' function as workaround
					// because cutting planes are display too small after restore viewstate
					this.viewer
						.reset()
						.then(function () {
							// I-019332 Axis triad is broken after loading geometry
							self.recreateTriad();
							self.loadCameraFromViewState(viewStateData);
						})
						.then(function () {
							self.clearViewState(viewStateData);
						});
				},

				restoreViewMode: function (viewStateData) {
					const viewMode = viewStateData.getValue('viewMode');
					if (viewMode) {
						if (this.viewModesMap[viewMode]) {
							var ddViewModes = this.toolbarContainer.viewToolbar.ddViewModes;
							if (ddViewModes) {
								ddViewModes.setSelectedValue(viewMode);
								this.setViewMode(viewMode);
							}
						} else {
							VC.Utils.AlertWarning(
								VC.Utils.GetResource('viewModeNotFoundWarning').Format(viewMode)
							);
						}
					}
				},

				restoreDynamicView: function (viewStateData) {
					const qdParameters = viewStateData.getValue('qdParameters');
					const result = this.validateParameters(qdParameters);
					let extraModelIds = viewStateData.getValue('extraModelIds');
					extraModelIds = extraModelIds === '' ? [] : JSON.parse(extraModelIds);
					this.onSetExtraModelIds(extraModelIds);

					if (result.errorType != null) {
						this.viewStateRestoringInProgress = false;
						const invalidParametersStr = result.invalidParameters
							.map((parameter) => `'${parameter}'`)
							.join(', ');
						const errorMessage = this.getInvalidParametersMessageTemplate(
							result.errorType
						).Format(invalidParametersStr);
						VC.Utils.AlertError(errorMessage);
					} else {
						this.onLoadWithParameters(result.validatedParameters);
					}
				},

				getInvalidParametersMessageTemplate: function (errorType) {
					let messageTemplate = null;

					switch (errorType) {
						case VC.Utils.Enums.InvalidParametersErrorType.noParamInTgvd:
							messageTemplate = VC.Utils.GetResource(
								'noParamInTgvdMessageTemplate'
							);
							break;
						case VC.Utils.Enums.InvalidParametersErrorType.noParamInSavedView:
							messageTemplate = VC.Utils.GetResource(
								'noParamInSavedViewMessageTemplate'
							);
							break;
					}

					return messageTemplate;
				},

				validateParameters: function (savedViewParametersStr) {
					const result = {
						errorType: null,
						invalidParameters: null,
						validatedParameters: null
					};

					const currentParameters = JSON.parse(this.tgv_parameters);
					const savedViewParameters = JSON.parse(savedViewParametersStr);
					result.validatedParameters = currentParameters;

					const currentParametersKeys = Object.keys(currentParameters);
					const savedViewParametersKeys = Object.keys(savedViewParameters);
					let currentValue = null;

					//difference will output the elements from currentParametersKeys that are not in the savedViewParametersKeys
					let differenceCurrentView = currentParametersKeys.filter(
						(x) => !savedViewParametersKeys.includes(x)
					);
					// difference will output the elements from savedViewParametersKeys that are not in the currentParametersKeys
					let differenceSavedView = savedViewParametersKeys.filter(
						(x) => !currentParametersKeys.includes(x)
					);

					if (differenceCurrentView.length > 0) {
						result.errorType =
							VC.Utils.Enums.InvalidParametersErrorType.noParamInSavedView;
						result.invalidParameters = differenceCurrentView;
						result.validatedParameters = null;

						return result;
					}

					if (differenceSavedView.length > 0) {
						result.errorType =
							VC.Utils.Enums.InvalidParametersErrorType.noParamInTgvd;
						result.invalidParameters = differenceSavedView;
						result.validatedParameters = null;

						return result;
					}

					savedViewParametersKeys.forEach(function (currentKey) {
						currentValue = savedViewParameters[currentKey];
						currentParameter = currentParameters[currentKey];

						result.validatedParameters[currentKey] = currentValue;
					});

					if (result.validatedParameters) {
						result.validatedParameters = JSON.stringify(
							result.validatedParameters
						);
					}

					return result;
				},

				getViewerOutMode: function (message) {
					let actualMode = VC.Utils.Enums.ViewerOutModes.Standard;
					let item = this.aras.newIOMItem('DynamicViewDefinition', 'get');

					item.setAttribute('id', message.markup.fileId);
					item.setAttribute('select', 'id,item_type');
					item = item.apply();

					if (item.getItemCount() > 0) {
						const dvdItem = item.getItemByIndex(0);
						const contextItemType = dvdItem.getProperty('item_type');

						if (contextItemType !== this.args.itemWindow.itemTypeID) {
							actualMode =
								VC.Utils.Enums.ViewerOutModes.DifferentItemTypeContext;
						}
					} else {
						actualMode = VC.Utils.Enums.ViewerOutModes.Limited;
					}

					return actualMode;
				},

				displayFileIfViewerNotInitializedBefore: function (message) {
					if (!this.fileUrl) {
						const actualMode = this.getViewerOutMode(message);

						if (actualMode !== VC.Utils.Enums.ViewerOutModes.Limited) {
							this.displayFile('DynamicCadAssemblyFileUrl');
						}
					}
				},

				showViewerInOutOfContextMode: function (message) {
					const actualMode = this.getViewerOutMode(message);

					switch (actualMode) {
						case VC.Utils.Enums.ViewerOutModes.Limited:
							this.applyNoDVDMode();
							break;
						case VC.Utils.Enums.ViewerOutModes.DifferentItemTypeContext:
							this.applyDifferentItemTypeContextMode(message);
							break;
					}
				},

				setupViewer: function (message) {
					if (this.loseCurrentMarkup()) {
						return;
					}
					this.displayFile('DynamicCadAssemblyFileUrl');

					this.displayMarkup(message.markup.getSnapshot());
					this.setViewState(message.markup.getViewData());
					this.onApplyViewStateData = this.applyViewStateData.bind(this);
				},

				applyNoDVDMode: function () {
					const message = VC.Utils.GetResource(
						'dvd_is_not_available_for_viewing'
					);
					VC.Utils.AlertWarning(message);
				},

				applyDifferentItemTypeContextMode: function (message) {
					const messageTextTemplate = VC.Utils.GetResource(
						'dynamic_3dviewer_is_not_available'
					);
					const savedItemTypeId = message.markup.item.getProperty(
						'markup_holder_type_id'
					);
					const savedItemTypeName = this.aras.getItemTypeName(savedItemTypeId);
					const currentItemType = this.args.itemWindow.itemTypeName;
					const messageText = messageTextTemplate.Format(
						savedItemTypeName,
						currentItemType
					);

					VC.Utils.AlertWarning(messageText);
				},

				setViewerControlsAccessibility: function (isAccessible) {
					if (this.toolbarContainer.btnMarkup) {
						this.toolbarContainer.btnMarkup.enable(isAccessible);
					}
					if (this.toolbarContainer.viewToolbar.btnZoomWindow) {
						this.toolbarContainer.viewToolbar.btnZoomWindow.enable(
							isAccessible
						);
					}
					let modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.DynamicModelBrowser
					);
					modelBrowserPanel.viewsTab.setAddSavedViewBtnAccessibility(
						isAccessible
					);
					if (isAccessible) {
						this.onEnableTgvToolbar();
					} else {
						this.onDisableTgvToolbar();
					}
				},

				isModelLoading: function () {
					return this.spinner.isViewerSpinnerVisible;
				},

				getCompressedProperty: function (item, propertyName) {
					var result = null;

					try {
						result = item.getProperty(propertyName);

						const compressionType = item.getPropertyAttribute(
							propertyName,
							'CompressionType'
						);

						if (compressionType === 'gzip') {
							let compressData = atob(result);
							compressData = compressData.split('').map(function (e) {
								return e.charCodeAt(0);
							});
							result = pako.inflate(compressData, { to: 'string' });
						}
					} catch (ex) {}

					return result;
				}
			});
		})()
	);
});
