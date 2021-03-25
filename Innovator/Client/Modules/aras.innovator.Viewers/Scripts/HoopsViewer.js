VC.Utils.Page.LoadModules([
	'HoopsViewerBase',
	'TreeNodeIdToModelNodeIdDictionary',
	'ModelConfigurationsDictionary'
]);
VC.Utils.Page.LoadWidgets(['ContextMenu/RightClickContextMenu']);

require([
	'dojo/aspect',
	'dojo/_base/connect',
	'dojo/_base/declare',
	'dojo/_base/lang'
], function (aspect, connect, declare, lang) {
	return dojo.setObject(
		'VC.HoopsViewer',
		(function () {
			var currMeasureOperation = 'Select';

			return declare('HoopsViewer', VC.HoopsViewerBase, {
				legacyModelType: false,
				scsFileBackgroundColor: null,
				legacyFileBackgroundColorTop: null,
				legacyFileBackgroundColorBottom: null,
				defaultCappingColor: null,
				defaultCappingGeometryVisibility: true,
				treeNodeIdToModelNodeIdDictionary: null,
				hoopsContainer: null,
				resolution: 'AsSaved',
				modelXml: null,
				contextMenu: null,
				modelConfigurations: [],
				selectedCadViewId: '', //should be moved to HoopsViewerBasic in I-003065 issue
				modelConfigurationsDictionary: null,
				zoomToCursorPropertyName: 'zoom_to_cursor_for_monolithic',

				constructor: function (args) {
					var self = this;

					this.type = 'hoops';

					this.scsFileBackgroundColor = new Communicator.Color(255, 255, 255);
					this.legacyFileBackgroundColorTop = new Communicator.Color(
						0,
						82,
						189
					);
					this.legacyFileBackgroundColorBottom = new Communicator.Color(
						217,
						217,
						217
					);
					this.defaultCappingColor = new Communicator.Color(0, 255, 0);
				},

				setViewerCallbacks: function () {
					var self = this;

					this.viewer.setCallbacks({
						modelStructureParseBegin: function () {
							self.setLoadingProgress(25);
						},

						sceneReady: function () {
							self.setLoadingProgress(30);
							self.createAxisTriad();
						},

						modelStructureReady: function () {
							if (self.legacyModelType) {
								importer = new Communicator.HWF.Importer(self.viewer);
								importer.import({
									url: self.fileUrl
								});
							} else {
								self.setLoadingProgress(101);
								self.onViewerLoaded();
							}

							var modelBrowserPanel = self.DialogManager.getExistingOrNewDialog(
								VC.Utils.Enums.Dialogs.ModelBrowser
							);
							modelBrowserPanel.viewsTab.isSavedViewsSupported = false;
							modelBrowserPanel.viewsTab.loadViews();
						},

						hwfParseComplete: function () {
							self.setLoadingProgress(101);
							self.onViewerLoaded();
						},

						selectionArray: function (selectionEvents) {
							var selectionEvent = null;
							if (selectionEvents && selectionEvents[0]) {
								selectionEvent = selectionEvents[0];
							}
							if (VC.Utils.isNotNullOrUndefined(selectionEvent)) {
								var modelBrowser = self.DialogManager.getExistingOrNewDialog(
									VC.Utils.Enums.Dialogs.ModelBrowser
								);

								if (!modelBrowser.modelTab.isSelectionFromTree) {
									var selection = selectionEvent.getSelection();
									var treeNodeId = self.getTreeNodeFromSelectedNode(selection);
									if (treeNodeId) {
										modelBrowser.modelTab.selectTreeItem(treeNodeId);
									}
								}
							}
							// "Orient To Face" button's state depends on the current selection's type
							self.setBtnOrientToFaceAccessibility(selectionEvent);
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

				createViewerContextMenu: function () {
					var self = this;

					var hiddenItems = [];
					if (this.legacyModelType) {
						hiddenItems.push('open');
					}
					self.contextMenu = new VC.Viewers.RightClickContextMenu(
						this.viewerContainer.id,
						this.viewer,
						hiddenItems
					);

					self.contextMenu.onOpenCad = function (selectedNode) {
						if (selectedNode) {
							var treeNodeId = self.getTreeNodeFromSelectedNode(selectedNode);
							var cadId = self.treeNodeIdToModelNodeIdDictionary.getCadId(
								'treeNodeId',
								treeNodeId
							);
							self.openCadDocument(cadId);
						}
					};

					self.contextMenu.onIsolate = function (selectedNode) {
						if (selectedNode) {
							var selectedNodeID = self.getSelectedNodeID(selectedNode);
							self.isolateSelectedNodes([selectedNodeID]);
						}
					};

					self.contextMenu.onFitAll = function () {
						self.fitAllNodes();
					};

					self.contextMenu.onResetView = function () {
						self.resetView();
					};

					self.contextMenu.onVisibility = function (selectedNode) {
						if (selectedNode) {
							var selectedNodeID = self.getSelectedNodeID(selectedNode);
							var isNodeVisible = self.viewer
								.getModel()
								.getNodeVisibility(selectedNodeID);
							self.setVisibilitySelectedNodes([selectedNodeID], isNodeVisible);
						}
					};

					self.contextMenu.onHideAllOther = function (selectedNode) {
						if (selectedNode) {
							var selectedNodeID = self.getSelectedNodeID(selectedNode);
							self.hideAllOtherNodes([selectedNodeID]);
						}
					};

					self.contextMenu.onDisplayAll = function () {
						self.displayAllNodes();
					};
				},

				getFileUrlExtension: function () {
					var self = this;

					var fileId = /fileID=([^&]+)/gi.exec(self.fileUrl)[1];
					var fileName = /fileName=([^&]+)/gi.exec(self.fileUrl)[1];
					var modelPath =
						fileId.substring(0, 1) +
						'/' +
						fileId.substring(1, 3) +
						'/' +
						fileId.substr(3, fileId.length - 3) +
						'/' +
						fileName;
					var ind = fileName.lastIndexOf('.');
					return fileName.substring(ind + 1).toUpperCase();
				},

				initializeViewer: function (args) {
					var self = this;
					this.treeNodeIdToModelNodeIdDictionary = new VC.Viewers.TreeNodeIdToModelNodeIdDictionary();

					var fileExt = this.getFileUrlExtension();

					if (fileExt === 'HWF') {
						this.legacyModelType = true;
					}

					if (this.legacyModelType) {
						this.viewer = new Communicator.WebViewer({
							containerId: this.viewerContainer.id,
							empty: true
						});
					} else {
						this.viewer = new Communicator.WebViewer({
							containerId: this.viewerContainer.id,
							endpointUri: self.fileUrl, //server URL to scs file
							model: '',
							rendererType: Communicator.RendererType.Client,
							streamingMode: Communicator.StreamingMode.Interactive
						});

						this.viewer.start();
						this.isStarted = true;
					}

					this.setViewerCallbacks();
					this.initSplitter();

					VC.Utils.Page.LoadModules(['Controls/CuttingPlaneControl']);

					this.createViewerContextMenu();

					this.cuttingPlaneControl = new VC.Widgets.CuttingPlaneControl(
						new Communicator.Ui.CuttingPlaneController(this.viewer)
					);
					this.setZoomToMousePositionFromDatabase(
						this.zoomToCursorPropertyName
					);
					this.isViewerInitialized = true;
				},

				openCadDocument: function (cadId) {
					this.aras.uiShowItem('CAD', cadId, 'tab view');
				},

				isolateSelectedNodes: function (selectedNodeIDs) {
					this.viewer.getView().fitNodes(selectedNodeIDs);
					this.setModelTransparency(0.1, 0, selectedNodeIDs);
					this.viewer.getSelectionManager().clear();
				},

				setVisibilitySelectedNodes: function (selectedNodeIDs, isNodeVisible) {
					this.viewer.getSelectionManager().clear();

					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
					for (var i = 0; i < selectedNodeIDs.length; i++) {
						var treeNodeId = this.getTreeNodeIdByNodeId(selectedNodeIDs[i]);
						if (isNodeVisible) {
							modelBrowserPanel.modelTab.onHidePart(treeNodeId);
							modelBrowserPanel.modelTab.setNodeDisabled(treeNodeId);
						} else {
							modelBrowserPanel.modelTab.onShowPart(treeNodeId);
							modelBrowserPanel.modelTab.setNodeEnabled(treeNodeId);
						}
					}
				},

				hideAllOtherNodes: function (selectedNodeIDs) {
					var self = this;
					this.viewer.getView().isolateNodes(selectedNodeIDs);
					this.viewer.getSelectionManager().clear();

					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
					for (var i = 0; i < selectedNodeIDs.length; i++) {
						var treeNodeId = this.getTreeNodeIdByNodeId(selectedNodeIDs[i]);
						modelBrowserPanel.modelTab.setNodesDisabled(treeNodeId);
						modelBrowserPanel.modelTab.setNodeEnabled(treeNodeId);
					}
				},

				resetView: function () {
					var self = this;

					this.resetViewBase(VC.Utils.Enums.Dialogs.ModelBrowser);

					// viewer.model.reset function don't work for legacyModelType, so use this.viewer.reset funcion
					if (this.legacyModelType) {
						this.viewer.reset().then(function () {
							//set "IsoView" direction as a workaround of known issue in HOOPS Communicator 2019
							self.setViewDirection('IsoView', self.directionDuration);
						});
					} else {
						// replace call this.viewer.reset with this.viewer.model.reset as a workround of known issue with reset camera in HOOPS Communicator 2019
						this.viewer.model.reset().then(function () {
							//set "IsoView" direction as a workaround of known issue in HOOPS Communicator 2019
							self.setViewDirection('IsoView', self.directionDuration);
						});
					}

					// Switch to the initial view of component geometry from activated CAD View
					var handleOperator = this.viewer
						.getOperatorManager()
						.getOperator(Communicator.OperatorId.Handle);
					handleOperator.removeHandles();

					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
					modelBrowserPanel.modelTab.setNodesEnabled();

					this.selectedCadViewId = '';

					if (this.viewerToolbar.btnPMI) {
						var pMIs = this.viewer.getModel().getPmis();
						this.updatePMIButtonState(pMIs);
					}
				},

				displayAllNodes: function () {
					this.viewer.getModel().resetNodesVisibility();
					this.viewer.getModel().resetModelTransparency();
					this.viewer.getSelectionManager().clear();

					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
					modelBrowserPanel.modelTab.setNodesEnabled();
				},

				setModelTransparency: function (
					transparency,
					parentNode,
					selectedNodeIds
				) {
					var model = this.viewer.getModel();
					var childs = model.getNodeChildren(parentNode);
					for (var i = 0; i < childs.length; i++) {
						if (selectedNodeIds.indexOf(childs[i]) >= 0) {
							model.setNodesTransparency([childs[i]], 1);
						} else {
							model.setNodesTransparency([childs[i]], transparency);
							this.setModelTransparency(
								transparency,
								childs[i],
								selectedNodeIds
							);
						}
					}
				},

				getSelectedNodeID: function (selection) {
					if (selection) {
						var selectionType = selection.getSelectionType();
						if (selectionType !== Communicator.SelectionType.None) {
							let selectedNodeID = selection.getNodeId();
							const model = this.viewer.getModel();

							if (
								model.getNodeType(selectedNodeID) ==
								Communicator.NodeType.BodyInstance
							) {
								selectedNodeID = model.getNodeParent(selectedNodeID);
							}
							return selectedNodeID;
						}
					}
				},

				//function returns cadID by nodeID or parentNodeId depending on the node type
				//if node has BodyInstance type (node is a instanced mesh/body), parentNodeID is used, otherwise, nodeID
				getTreeNodeIdByNodeId: function (nodeId) {
					var model = this.viewer.getModel();
					if (
						model.getNodeType(nodeId) === Communicator.NodeType.BodyInstance
					) {
						nodeId = model.getNodeParent(nodeId);
					}

					return this.treeNodeIdToModelNodeIdDictionary.getTreeNodeId(nodeId);
				},

				getTreeNodeFromSelectedNode: function (selection) {
					var selectedNodeID = this.getSelectedNodeID(selection);
					if (selectedNodeID) {
						return this.getTreeNodeIdByNodeId(selectedNodeID);
					}
				},

				getCadIdFromModel: function (nodeId, callback) {
					if (nodeId) {
						var model = this.viewer.getModel();
						model.getNodeProperties(nodeId).then(function (props) {
							if (props) {
								if (props.hasOwnProperty('CAD ID')) {
									var selectedCadID = props['CAD ID'];
									if (callback) {
										callback(nodeId, selectedCadID);
									}
								}
							}
						});
					}
				},

				getMonolithicModelXML: function (resolution) {
					var body =
						'<root_cad_id>' +
						this.args.markupHolderId +
						'</root_cad_id>' +
						'<resolution>' +
						resolution +
						'</resolution>';
					var inn = this.aras.newIOMInnovator();
					var results = inn.applyMethod('CreateMonolithicModelXML', body);

					if (!results.isError()) {
						this.modelXml = results.getResult();

						var modelXmlDocument = this.aras.createXMLDocument();
						modelXmlDocument.loadXML(this.modelXml);

						var modelConfigurations = modelXmlDocument.selectNodes(
							'/ModelConfigurations/ModelConfiguration'
						);
						for (var i = 0; i < modelConfigurations.length; i++) {
							var configId = modelConfigurations[i].getAttribute('Id');
							var modelXml = modelConfigurations[i].selectSingleNode('Root')
								.xml;
							this.modelConfigurationsDictionary.addPair(
								parseInt(configId, VC.Utils.Constants.radix),
								modelXml
							);
						}
					}
				},

				onViewerLoaded: function () {
					this.inherited(arguments);

					this.disableMultiplePartSelection();

					if (this.legacyModelType) {
						this.viewer
							.getView()
							.setBackgroundColor(
								this.legacyFileBackgroundColorTop,
								this.legacyFileBackgroundColorBottom
							);

						// For some reason size of HWF model is bigger than WebViewer screen
						// It was decided to set "IsoView" direction to decrease initial zoom for HWF models
						this.setViewDirection('IsoView', this.directionDuration);
					} else {
						this.viewer
							.getView()
							.setBackgroundColor(
								this.scsFileBackgroundColor,
								this.scsFileBackgroundColor
							);
					}

					var cuttingManager = this.viewer.getCuttingManager();
					cuttingManager.setCappingFaceColor(this.defaultCappingColor);
					cuttingManager.setCappingLineColor(this.defaultCappingColor);
					cuttingManager.setCappingGeometryVisibility(
						this.defaultCappingGeometryVisibility
					);
					this.initModelConfigurationsDropDown();
					this.activateDefaultConfiguration();

					this.viewer
						.getView()
						.getHiddenLineSettings()
						.setObscuredLineTransparency(0);

					this.applyViewStateData();
					this.restoreViewerState();
				},

				loadViewerToolbar: function () {
					var self = this;
					const showModelBrowserFunction = lang.partial(
						lang.hitch(self, self.showModelBrowser),
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.HoopsViewerToolbar
					);
					this.loadViewerToolbarBase();

					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnModelBrowserClick,
						showModelBrowserFunction
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnResetViewClick,
						lang.hitch(self, self.resetCamera)
					);

					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.ddModelConfigurations,
						lang.hitch(self, self.activateSelectedConfiguration)
					);

					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnModelBrowser,
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
				},

				_loadFile: function () {
					if (!this.isStarted) {
						//this.viewer.setFilename(this.fileUrl);
						this.viewer.start();
						this.isStarted = true;
					}
				},

				_toMarkupMode: function () {
					this.showSnapshot();
					this.hideViewer();
					this.DialogManager.closeAllDialogsButThis(
						VC.Utils.Enums.Dialogs.ModelBrowser
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

				displayMarkup: function (imgUrl) {
					this.inherited(arguments);
					this.DialogManager.needRestoreMeasureDialog = false;
				},

				loadContainer: function () {
					VC.Utils.Page.LoadModules(['Widgets/HoopsViewerContainer']);

					var htmlContainer = new VC.Widgets.ViewerContainer();
					htmlContainer.placeAt(document.body);

					var args = {
						cadId: this.args.markupHolderId,
						resolution: this.resolution
					};
					this.DialogManager.viewerType = this.type;
					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser,
						args
					);
					this.modelConfigurationsDictionary = new VC.Viewers.ModelConfigurationsDictionary();

					this.initViewerContent(modelBrowserPanel, htmlContainer);

					return htmlContainer;
				},

				loadDictionaryAndTree: function () {
					var self = this;
					var modelBrowserPanel = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					self.treeNodeIdToModelNodeIdDictionary.clearDictinary();
					if (self.legacyModelType) {
						var itemWindow = self.args.itemWindow;
						var nodeProperties = {
							treeNodeId: '1',
							itemId: itemWindow.itemID,
							itemName: itemWindow.item.selectSingleNode('./keyed_name').text
						};
						self.treeNodeIdToModelNodeIdDictionary.addPair(
							undefined,
							nodeProperties.treeNodeId,
							nodeProperties.itemId
						);
						modelBrowserPanel.modelTab.loadTreeDataForHWF(nodeProperties);
					} else {
						self.getMonolithicModelXML('Current');
						modelBrowserPanel.modelTab.loadTreeData(self.modelXml);
						modelBrowserPanel.modelTab.fillTreeNodeIdToModelNodeIdDictionary(
							self.treeNodeIdToModelNodeIdDictionary
						);
					}
				},

				applyViewStateData: function () {
					if (!this.viewer || this.viewStateData.isEmpty()) {
						return;
					}
					this.loadCameraFromViewState(this.viewStateData);

					var modelConfiguration = this.viewStateData.getValue(
						'modelConfiguration'
					);
					if (modelConfiguration !== '') {
						modelConfiguration = parseInt(modelConfiguration, VC.Utils.radix);
						this.selectConfigurationInDropDown(modelConfiguration);
						this.activateConfiguration(modelConfiguration);
					}

					var processVisibleItemsFuncWithParam = null;
					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					modelBrowserPanel.modelTab.setNodesEnabled();
					this.viewer.getModel().resetNodesVisibility();

					var hiddenItemsStr = this.viewStateData.getValue('hiddenItemIds');

					if (hiddenItemsStr !== '') {
						var hiddenItemIds = JSON.parse(hiddenItemsStr);
						var processVisibleItemsFunction = lang.hitch(
							this,
							'processHiddenItemsFromViewState'
						);
						processVisibleItemsFuncWithParam = lang.partial(
							processVisibleItemsFunction,
							modelBrowserPanel.modelTab,
							hiddenItemIds
						);

						if (modelBrowserPanel.modelTab.isTreeReady) {
							processVisibleItemsFuncWithParam();
						} else {
							modelBrowserPanel.modelTab.onAllNodesRendered = processVisibleItemsFuncWithParam;
						}
					}
				},

				processHiddenItemsFromViewState: function (modelTab, hiddenItemIds) {
					if (hiddenItemIds.length > 0) {
						this.viewer
							.getModel()
							.setNodesVisibility(hiddenItemIds.map(Number), false);
						modelTab.setNodesDisabledByModelNodeIds(
							hiddenItemIds,
							this.treeNodeIdToModelNodeIdDictionary
						);
					}
				},

				restoreViewerState: function () {
					this.restoreModelBrowserButtonState(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					if (this.viewerToolbar.btnPMI) {
						const cadViewId = this.getActivatedCADViewID();

						if (cadViewId) {
							var pMIs = this.viewer.getModel().getPmis();
							if (Object.keys(pMIs).length > 0) {
								this.restorePmiButtonPressedState();
								this.viewerToolbar.btnPMI.onClick();
							} else {
								this.viewerToolbar.btnPMI.Disable();
							}
						} else {
							this.viewerToolbar.btnPMI.Disable();
						}
					}
				},

				restorePmiButtonPressedState: function () {
					if (this.viewerToolbar.btnPMI) {
						const curState = this.restoreViewerParameter(
							this.type + '.' + VC.Utils.Enums.TButtonEvents.btnPMIClick
						);
						if (curState !== null && curState.localeCompare('On') === 0) {
							this.viewerToolbar.btnPMI.SetPressedState(true);
						} else {
							this.viewerToolbar.btnPMI.SetPressedState(false);
						}
					}
				},

				saveCameraToViewState: function () {
					var cameraString = JSON.stringify(
						this.viewer.getView().getCamera().toJson()
					);
					this.viewStateData.updateValue('camera', cameraString);
				},

				saveHiddenItemsToViewState: function () {
					var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ModelBrowser
					);
					var modelNodeIdsOfHiddenTreeNodes = modelBrowserPanel.modelTab.getModelNodeIdsOfHiddenTreeNodes();
					var hiddenModelNodeIds = [];
					for (var i = 0; i < modelNodeIdsOfHiddenTreeNodes.length; i++) {
						if (
							!this.viewer
								.getModel()
								.getNodeVisibility(modelNodeIdsOfHiddenTreeNodes[i])
						) {
							hiddenModelNodeIds.push(modelNodeIdsOfHiddenTreeNodes[i]);
						}
					}

					this.viewStateData.updateValue(
						'hiddenItemIds',
						JSON.stringify(hiddenModelNodeIds)
					);
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
							self.applyViewStateData();
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

							self.saveCameraToViewState();
							self.saveHiddenItemsToViewState();
							self.saveModelConfigurationToViewState();
						}
					};

					this.assignBasicToolbarSwitchClickHandler();

					aspect.after(
						this.toolbarContainer,
						'onBtnSwitchClick',
						lang.hitch(this, function () {
							this.initModelConfigurationsDropDown();
							this.activateDefaultConfiguration();
						})
					);
				},

				resetCamera: function () {
					this.resetView();
				},

				togglePMIs: function () {
					this.viewerToolbar.btnPMI.SetPressedState(
						!this.viewerToolbar.btnPMI.IsPressed
					);

					this.setPMIsVisibility(this.viewerToolbar.btnPMI.IsPressed);

					this.saveViewerParameter(
						this.type + '.' + VC.Utils.Enums.TButtonEvents.btnPMIClick,
						this.viewerToolbar.btnPMI.IsPressed ? 'On' : 'Off'
					);
				},

				setPMIsVisibility: function (visibility) {
					var model = this.viewer.getModel();
					var pMIs = [];
					if (this.selectedCadViewId == '') {
						var cadViewId = this.getActivatedCADViewID();
						pMIs = model.getCadViewPmis(cadViewId);
						if (pMIs.length == 0) {
							pMIs = model.getPmis();
							var pMIids = Object.keys(pMIs);
							pMIids = pMIids.map(Number);
							model.setNodesVisibility(pMIids, visibility);
						} else {
							model.setNodesVisibility(pMIs, visibility);
						}
					} else {
						pMIs = model.getCadViewPmis(this.selectedCadViewId);
						model.setNodesVisibility(pMIs, visibility);
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
						this.crossSectionInitHandlers(crossSectionDialog);
					}

					self.viewer.getCuttingManager().activateCuttingSections();
				},

				assignModelBrowserHandlers: function (modelBrowser) {
					var self = this;

					modelBrowser.modelTab.onSelectTreeItem = function (treeNodeId) {
						var selectionManager = self.viewer.getSelectionManager();
						var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
							treeNodeId
						);

						selectionManager.clear();

						if (nodeIds) {
							var selectionMode =
								nodeIds.length > 0
									? Communicator.SelectionMode.Add
									: Communicator.SelectionMode.Set;
							for (var i = 0; i < nodeIds.length; i++) {
								selectionManager.selectNode(nodeIds[i], selectionMode);
							}
						}
					};

					modelBrowser.modelTab.onOpenCad = function (treeNodeId) {
						var cadId = self.treeNodeIdToModelNodeIdDictionary.getCadId(
							'treeNodeId',
							treeNodeId
						);
						self.openCadDocument(cadId);
					};

					modelBrowser.modelTab.onIsolate = function (treeNodeId) {
						var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
							treeNodeId
						);
						if (nodeIds) {
							self.isolateSelectedNodes(nodeIds);
						}
					};

					modelBrowser.modelTab.onVisibility = function (
						treeNodeId,
						isVisible
					) {
						var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
							treeNodeId
						);
						if (nodeIds) {
							self.setVisibilitySelectedNodes(nodeIds, isVisible);
						}
					};

					modelBrowser.modelTab.onHideAllOther = function (treeNodeId) {
						var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
							treeNodeId
						);
						if (nodeIds) {
							self.hideAllOtherNodes(nodeIds);
						}
					};

					modelBrowser.modelTab.onFitAll = function () {
						self.fitAllNodes();
					};

					modelBrowser.modelTab.onResetView = function () {
						self.resetView();
					};

					modelBrowser.modelTab.onDisplayAll = function () {
						self.displayAllNodes();
					};

					modelBrowser.onAfterShow = this.onAfterShowModelBrowserHandler.bind(
						this,
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					modelBrowser.onAfterHide = this.onAfterHideModelBrowserHandler.bind(
						this,
						VC.Utils.Enums.Dialogs.ModelBrowser
					);

					modelBrowser.modelTab.onShowPart = function (treeNodeId) {
						if (!self.legacyModelType) {
							var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
								treeNodeId
							);
							self.setNodesVisibility(nodeIds, true);
						}
					};

					modelBrowser.modelTab.onHidePart = function (treeNodeId) {
						if (!self.legacyModelType) {
							var nodeIds = self.treeNodeIdToModelNodeIdDictionary.getNodeIds(
								treeNodeId
							);
							self.setNodesVisibility(nodeIds, false);
						}
					};

					modelBrowser.modelTab.isLegacyModelType = function () {
						return self.legacyModelType;
					};

					modelBrowser.modelTab.isSelectedNodeVisible = this.isSelectedNodeVisible.bind(
						this
					);

					modelBrowser.modelTab.onReadyModelTree = lang.hitch(
						this,
						'loadDictionaryAndTree'
					);

					modelBrowser.viewsTab.onGetCustomViews = this.getCustomViews.bind(
						this
					);

					modelBrowser.viewsTab.onSelectStandardView = this.onSelectStandardViewHandler.bind(
						this
					);

					modelBrowser.viewsTab.onSelectCustomView = this.onSelectCustomViewHandler.bind(
						this
					);
				},

				isSelectedNodeVisible: function (treeNodeId) {
					var nodeIds = this.treeNodeIdToModelNodeIdDictionary.getNodeIds(
						treeNodeId
					);

					if (nodeIds && nodeIds.length > 0) {
						return this.viewer.getModel().getNodeVisibility(nodeIds[0]);
					}

					return false;
				},

				onSelectStandardViewHandler: function (viewDirectionType) {
					this.setViewDirection(viewDirectionType, this.directionDuration);
				},

				onSelectCustomViewHandler: function (cadViewId) {
					this.applyCustomView(cadViewId);
					this.selectedCadViewId = +cadViewId;
					this.setPMIButtonState();
				},

				setPMIButtonState: function () {
					if (this.viewerToolbar.btnPMI) {
						var cadViewId = this.selectedCadViewId;
						if (cadViewId) {
							var pMIs = this.viewer.getModel().getCadViewPmis(cadViewId);
							this.updatePMIButtonState(pMIs);
						} else {
							this.viewerToolbar.btnPMI.Disable();
							this.viewerToolbar.btnPMI.SetPressedState(false);
							this.deleteViewerParameter(
								this.type + '.' + VC.Utils.Enums.TButtonEvents.btnPMIClick
							);
						}
					}
				},

				updatePMIButtonState: function (pMIs) {
					if (Object.keys(pMIs).length > 0) {
						this.viewerToolbar.btnPMI.Enable();
						this.viewerToolbar.btnPMI.SetPressedState(true);
						this.saveViewerParameter(
							this.type + '.' + VC.Utils.Enums.TButtonEvents.btnPMIClick,
							this.viewerToolbar.btnPMI.IsPressed ? 'On' : 'Off'
						);
					} else {
						this.viewerToolbar.btnPMI.Disable();
						this.viewerToolbar.btnPMI.SetPressedState(false);
						this.deleteViewerParameter(
							this.type + '.' + VC.Utils.Enums.TButtonEvents.btnPMIClick
						);
					}
				},

				activateSelectedConfiguration: function () {
					if (this.toolbarContainer.viewToolbar.ddModelConfigurations) {
						var selectedConfiguration = this.toolbarContainer.viewToolbar
							.ddModelConfigurations.selectedItem;

						this.activateConfiguration(parseInt(selectedConfiguration, 10));
					}
				},

				saveModelConfigurationToViewState: function () {
					if (this.toolbarContainer.viewToolbar.ddModelConfigurations) {
						var selectedConfiguration = this.toolbarContainer.viewToolbar
							.ddModelConfigurations.selectedItem;
						this.viewStateData.updateValue(
							'modelConfiguration',
							selectedConfiguration
						);
					}
				},

				initModelConfigurationsDropDown: function () {
					if (
						this.toolbarContainer.viewToolbar.ddModelConfigurations &&
						this.modelConfigurations.length === 0
					) {
						var self = this;
						var configurations = this.viewer.model.getCadConfigurations();
						if (Object.keys(configurations).length > 0) {
							for (var key in configurations) {
								this.modelConfigurations.push({
									value: key,
									label: VC.Utils.Page.EncodeHTML(configurations[key])
								});
							}
							this.toolbarContainer.viewToolbar.ddModelConfigurations.addOptions(
								this.modelConfigurations
							);
							this.toolbarContainer.viewToolbar.ddModelConfigurations.Enable();
						} else {
							this.toolbarContainer.viewToolbar.ddModelConfigurations.Disable();
						}
					}
				},

				activateDefaultConfiguration: function () {
					var defaultCadConfiguration = this.viewer.model.getDefaultCadConfiguration();
					if (defaultCadConfiguration !== null) {
						this.selectConfigurationInDropDown(defaultCadConfiguration);
						this.activateConfiguration(defaultCadConfiguration);
					}
				},

				selectConfigurationInDropDown(configurationId) {
					if (this.toolbarContainer.viewToolbar.ddModelConfigurations) {
						this.toolbarContainer.viewToolbar.ddModelConfigurations.setSelectedValue(
							configurationId
						);
					}
				},

				activateConfiguration: function (configurationId) {
					if (
						this.viewer.model.getActiveCadConfiguration() !== configurationId
					) {
						this.viewer.model.activateCadConfiguration(configurationId);

						var modelBrowserPanel = this.DialogManager.getExistingOrNewDialog(
							VC.Utils.Enums.Dialogs.ModelBrowser
						);
						this.modelXml = this.modelConfigurationsDictionary.getModelXml(
							configurationId
						);
						this.treeNodeIdToModelNodeIdDictionary.clearDictinary();
						modelBrowserPanel.modelTab.loadTreeData(this.modelXml);
						modelBrowserPanel.modelTab.fillTreeNodeIdToModelNodeIdDictionary(
							this.treeNodeIdToModelNodeIdDictionary
						);
					}
				}
			});
		})()
	);
});
