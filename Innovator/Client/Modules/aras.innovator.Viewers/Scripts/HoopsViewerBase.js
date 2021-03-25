VC.Utils.Page.LoadModules(['Viewer', 'AxisTriad', 'FunctionExecutionLimiter']);

require([
	'dojo/aspect',
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/connect',
	'dijit/layout/ContentPane',
	'dijit/layout/BorderContainer'
], function (aspect, declare, lang, connect, ContentPane, BorderContainer) {
	return dojo.setObject(
		'VC.HoopsViewerBase',
		(function () {
			return declare('HoopsViewerBase', Viewer, {
				isStarted: false,
				content: null, // container with 'model browser left panel' and 'viewerContainer'
				measurementMarkup: null, // JSON Array with measurement markup
				annotationLabelSuffix: '# Annotation View',
				directionDuration: 500,
				zoomToCursorPropertyName: null,
				onSelectModeSelected: null,
				onZoomModeSelected: null,
				onZoomModeDispose: null,

				setSplitterVisibility: function (isVisible) {
					var splitter = this.content.getSplitter('left');
					splitter.domNode.style.display = isVisible ? '' : 'none';
				},

				initSplitter: function () {
					var splitter = this.content.getSplitter('left');
					var limiter = new VC.FunctionExecutionLimiter();

					var self = this;
					connect.connect(splitter, 'onMouseMove', self.viewer, function () {
						limiter.execute(self.viewer.resizeCanvas.apply(this));
					});
				},

				resizeContent: function () {
					this.content.resize();
					this.viewer.resizeCanvas();
				},

				// sets position of 'viewerContainer' when 'model broswer left panel' are shown or hidden
				adjustViewerContainerStyles: function (shownLeftPanel, dialogName) {
					var modelBrowser = this.DialogManager.getExistingOrNewDialog(
						dialogName
					);

					this.viewerContainer.style.top =
						VC.Widgets.Moveable.topLimiter + 'px';
					this.setSplitterVisibility(shownLeftPanel);

					if (shownLeftPanel) {
						this.viewerContainer.style.left = modelBrowser.width + 'px';
						this.viewerContainer.style.borderLeft = '1px solid #b5bcc7';
					} else {
						this.viewerContainer.style.left = '0px';
						this.viewerContainer.style.borderLeftWidth = '0px';
					}

					this.resizeContent();
				},

				//  Acceptable values for the parameter are:
				//  'HiddenLine'
				//  'WireFrameShaded'
				//  'Shaded'
				//  'WireFrame'
				setDisplayStyle: function (style) {
					switch (style) {
						case 'HiddenLine':
							this.viewer
								.getView()
								.setDrawMode(Communicator.DrawMode.HiddenLine);
							break;
						case 'WireFrameShaded':
							this.viewer
								.getView()
								.setDrawMode(Communicator.DrawMode.WireframeOnShaded);
							break;
						case 'Shaded':
							this.viewer.getView().setDrawMode(Communicator.DrawMode.Shaded);
							break;
						case 'WireFrame':
							this.viewer
								.getView()
								.setDrawMode(Communicator.DrawMode.Wireframe);
							break;
					}
				},

				displayStyleClick: function () {
					var self = this;

					var displayStyleDialog = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.DisplayStyle
					);

					if (!displayStyleDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnDisplayStyle,
							displayStyleDialog
						);

						displayStyleDialog.onWireframeClick = function () {
							self.setDisplayStyle('WireFrame');
							self.toolbarContainer.viewToolbar.btnDisplayStyle.SetImage(
								this.btnWireframe.baseSrc
							);
						};
						displayStyleDialog.onShadedClick = function () {
							self.setDisplayStyle('Shaded');
							self.toolbarContainer.viewToolbar.btnDisplayStyle.SetImage(
								this.btnShaded.baseSrc
							);
						};
						displayStyleDialog.onHiddenLineClick = function () {
							self.setDisplayStyle('HiddenLine');
							self.toolbarContainer.viewToolbar.btnDisplayStyle.SetImage(
								this.btnHiddenLine.baseSrc
							);
						};
						displayStyleDialog.onWireframeOnShadedClick = function () {
							self.setDisplayStyle('WireFrameShaded');
							self.toolbarContainer.viewToolbar.btnDisplayStyle.SetImage(
								this.btnWireframeOnShaded.baseSrc
							);
						};
						displayStyleDialog.isInitHandlers = true;
					}
				},

				createAxisTriad: function () {
					this._triad = new VC.AxisTriad(this.viewer);

					this.resizeContent();
				},

				recreateTriad: function () {
					this._triad.recreateTriad();
				},

				setNodesVisibility: function (nodeIds, visibility) {
					this.viewer.getModel().setNodesVisibility(nodeIds, visibility);
					this.viewer.getSelectionManager().clear();
				},

				getActivatedCADViewID: function () {
					var cadViewId = this.viewer.getModel().getActiveCadConfiguration();
					if (VC.Utils.isNotNullOrUndefined(cadViewId)) {
						return cadViewId;
					} else {
						// Initially activated CAD View is not recognized as activated by code above for some reason
						// We assume that first CAD View from the list of the all existing CAD Views was activated in this case
						var cadViews = this.viewer.getModel().getCadViews(); // { string(cad view id): string(label) , ...}
						var keys = Object.keys(cadViews);

						if (keys.length > 0) {
							return +keys[0];
						}
					}

					return null;
				},

				getNodesToFit: function (parentNode, fitNodesArray) {
					var model = this.viewer.getModel();
					var childs = model.getNodeChildren(parentNode);
					var nodeType;
					for (var i = 0; i < childs.length; i++) {
						if (
							model.getNodeVisibility(childs[i]) &&
							model.getNodeType(childs[i]) !==
								Communicator.NodeType.AssemblyNode
						) {
							fitNodesArray.push(childs[i]);
						}
						this.getNodesToFit(childs[i], fitNodesArray);
					}
				},

				fitAllNodes: function (selectedNode) {
					var fitNodesArray = [];
					this.getNodesToFit(
						this.viewer.getModel().getAbsoluteRootNode(),
						fitNodesArray
					);
					if (fitNodesArray.length !== 0) {
						this.viewer.getView().fitWorld();
					}
				},

				removeAllMeasurements: function () {
					this.viewer.getMeasureManager().removeAllMeasurements();
				},

				measureClick: function () {
					var self = this;

					var measureDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Measure
					);

					if (!measureDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnMeasure,
							measureDialog
						);

						measureDialog.onMeasurePointToPointClick = function () {
							self.setMeasureOperation('MeasurePoint');
						};
						measureDialog.onMeasureEdgesClick = function () {
							self.setMeasureOperation('MeasureEdge');
						};
						measureDialog.onMeasureAngleBetweenFacesClick = function () {
							self.setMeasureOperation('MeasureAngle');
						};
						measureDialog.onMeasureDistanceBetweenFacesClick = function () {
							self.setMeasureOperation('MeasureDistance');
						};
						measureDialog.onDeleteAllClick = function () {
							self.removeAllMeasurements();
						};
						measureDialog.onOpen = function () {
							var measureManager = self.viewer.getMeasureManager();
							if (self.measurementMarkup && self.measurementMarkup.length > 0) {
								measureManager.loadData(self.measurementMarkup, self.viewer);
							}

							var existMeasurements = measureManager.getAllMeasurements()
								.length;
							if (existMeasurements > 0) {
								measureDialog.btnDeleteAll.Enable();
							} else {
								measureDialog.btnDeleteAll.Disable();
							}
							self.DialogManager.setVisibilityOfMeasureButtons(
								existMeasurements
							);
						};
						measureDialog.onClose = function () {
							self.measurementMarkup = self.viewer
								.getMeasureManager()
								.exportMarkup();
							self.removeAllMeasurements();
							self.setMeasureOperation('Select');
						};

						measureDialog.isInitHandlers = true;
					}
				},

				orientToFaceClick: function () {
					this.setViewDirection('OrientToFace', this.directionDuration);
				},

				orientToFace: function () {
					var selectionItem = this.viewer.getSelectionManager().getLast();
					if (selectionItem && selectionItem.getFaceEntity()) {
						var normal = selectionItem.getFaceEntity().getNormal();
						var position = selectionItem.getPosition();
						var camera = this.viewer.getView().getCamera();
						var up = Communicator.Point3.cross(
							normal,
							new Communicator.Point3(0, 1, 0)
						);
						if (up.length() < 0.001) {
							up = Communicator.Point3.cross(
								normal,
								new Communicator.Point3(1, 0, 0)
							);
						}
						var zoomDelta = camera
							.getPosition()
							.subtract(camera.getTarget())
							.length();
						camera.setTarget(position);
						camera.setPosition(
							Communicator.Point3.add(
								position,
								Communicator.Point3.scale(normal, zoomDelta)
							)
						);
						camera.setUp(up);
						// replace call 'fitBounding' with 'setCamera' and 'fitNodes' as a workaround of known issue IR-073881 "Orient to Face function not working properly"
						this.viewer.getView().setCamera(camera);
						this.viewer.getView().fitNodes([selectionItem.getNodeId()], 400);
					}
				},

				//  Acceptable values for the parameter are:
				//  'FrontView'
				//  'BackView'
				//  'LeftView'
				//  'RightView'
				//  'BottomView'
				//  'TopView'
				//  'IsoView'
				//  'OrientToFace'
				setViewDirection: function (direction, viewDirectionDuration) {
					switch (direction) {
						case 'FrontView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Front,
									viewDirectionDuration
								);
							break;
						case 'BackView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Back,
									viewDirectionDuration
								);
							break;
						case 'LeftView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Left,
									viewDirectionDuration
								);
							break;
						case 'RightView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Right,
									viewDirectionDuration
								);
							break;
						case 'BottomView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Bottom,
									viewDirectionDuration
								);
							break;
						case 'TopView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Top,
									viewDirectionDuration
								);
							break;
						case 'IsoView':
							this.viewer
								.getView()
								.setViewOrientation(
									Communicator.ViewOrientation.Iso,
									viewDirectionDuration
								);
							break;
						case 'OrientToFace':
							this.orientToFace();
							break;
					}
				},

				setBtnOrientToFaceAccessibility: function (event) {
					if (this.viewerToolbar.btnOrientToFace) {
						var selectionItem = null;
						if (event) {
							selectionItem = event.getSelection();
						} else if (this.viewer) {
							selectionItem = this.viewer.getSelectionManager().getLast();
						}

						if (selectionItem && selectionItem.getFaceEntity()) {
							this.viewerToolbar.btnOrientToFace.Enable();
						} else {
							this.viewerToolbar.btnOrientToFace.Disable();
						}
					}
				},

				//  Acceptable values for the parameter are:
				//  'Select'
				//  'Note'
				//  'MeasureEdge'
				//  'MeasurePoint'
				//  'MeasureAngle'
				//  'MeasureDistance'
				setMeasureOperation: function (operation) {
					switch (operation) {
						case 'Select':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.Select, 1);
							break;
						case 'Note':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.Note, 1);
							break;
						case 'MeasureEdge':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.MeasureEdgeLength, 1);
							break;
						case 'MeasurePoint':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.MeasurePointPointDistance, 1);
							break;
						case 'MeasureAngle':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.MeasureFaceFaceAngle, 1);
							break;
						case 'MeasureDistance':
							this.viewer
								.getOperatorManager()
								.set(Communicator.OperatorId.MeasureFaceFaceDistance, 1);
							break;
					}
				},

				//  Acceptable values for the parameter are:
				//  'AxisX'
				//  'AxisY'
				//  'AxisZ'
				//  'SelectFaceNormal'
				//  'Invert'
				setCrossSectionOrientation: function (orientation) {
					switch (orientation) {
						case 'AxisX':
							this.cuttingPlaneControl.onAxisToggle('x');
							break;
						case 'AxisY':
							this.cuttingPlaneControl.onAxisToggle('y');
							break;
						case 'AxisZ':
							this.cuttingPlaneControl.onAxisToggle('z');
							break;
						case 'SelectFaceNormal':
							this.cuttingPlaneControl.onAxisToggle('face');
							break;
						case 'InvertX':
							this.cuttingPlaneControl.onAxisInvert('x');
							break;
						case 'InvertY':
							this.cuttingPlaneControl.onAxisInvert('y');
							break;
						case 'InvertZ':
							this.cuttingPlaneControl.onAxisInvert('z');
							break;
						case 'InvertFace':
							this.cuttingPlaneControl.onAxisInvert('face');
							break;
					}
				},

				loadViewerToolbarBase: function () {
					var self = this;
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomUpClick,
						lang.hitch(self, self.zoom, +0.8)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomDownClick,
						lang.hitch(self, self.zoom, +1.333333333333333)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnOrientToFaceClick,
						lang.hitch(self, self.orientToFaceClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnDisplayStyleClick,
						lang.hitch(self, self.displayStyleClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnMeasureClick,
						lang.hitch(self, self.measureClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnExplodedViewClick,
						lang.hitch(self, self.explodedViewClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnCrossSectionClick,
						lang.hitch(self, self.crossSectionClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPMIClick,
						lang.hitch(self, self.togglePMIs)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPreferencesClick,
						self.showPreferences.bind(self)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomWindowClick,
						self.ZoomWindowClick.bind(self)
					);

					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnDisplayStyle,
						VC.Utils.Enums.Dialogs.DisplayStyle
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnMeasure,
						VC.Utils.Enums.Dialogs.Measure
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnExplodedView,
						VC.Utils.Enums.Dialogs.Exploded
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnCrossSection,
						VC.Utils.Enums.Dialogs.CrossSection
					);

					// "Orient To Face" button should be initially disabled because there is no selections
					this.setBtnOrientToFaceAccessibility();
				},

				showPreferences: function () {
					const self = this;
					const isZoomToCursor = this.getZoomToMousePosition(
						this.zoomToCursorPropertyName
					);
					const preferencesDialog = new ViewerModules.Dialog.preferences(
						isZoomToCursor
					);

					preferencesDialog.then(function (dialogResult) {
						if (VC.Utils.isNotNullOrUndefined(dialogResult)) {
							self.updateZoomToCursorPreference(
								self.zoomToCursorPropertyName,
								dialogResult
							);
							self.setZoomToMousePosition(dialogResult);
						}
					});
				},

				ZoomWindowClick: function () {
					this._toZoomMode();
					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(true);
				},

				_toZoomMode: function () {
					this.zoomWindow = true;
					this.cleanZoomingPage();
					this.addZoomingPage(
						this.viewerContainer.clientWidth,
						this.viewerContainer.clientHeight
					);

					this.zoomingPage.startSelecting();

					this.zoomingPage.container.OnSelectingStart = this._toZoomModeOnSelectingStart.bind(
						this
					);
					this.zoomingPage.container.OnSelectingEnd = this._toZoomModeOnSelectingEnd.bind(
						this
					);

					if (this.onZoomModeSelected) {
						this.onZoomModeSelected();
					}
				},

				_toZoomModeOnSelectingStart: function () {
					this.DialogManager.disableOpenedDialogs();
				},

				_toZoomModeOnSelectingEnd: function () {
					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(
						false
					);
					this.zoomWindow = false;
					this.DialogManager.enableOpenedDialogs();
					this.execZooming();
					this.cleanZoomingPage();
					if (this.onZoomModeDispose) {
						this.onZoomModeDispose();
					}
				},

				execZooming: function () {
					const zoomingBox = this.zoomingPage.getSelectionBox();

					if (zoomingBox && zoomingBox.width > 0 && zoomingBox.height > 0) {
						const ratioX = this.viewerContainer.clientWidth / zoomingBox.width;
						const ratioY =
							this.viewerContainer.clientHeight / zoomingBox.height;
						const curRatio = 1 / Math.min(ratioX, ratioY);

						let view = this.viewer.getView();
						let camera = view.getCamera();
						var centerPoint = new Communicator.Point2(
							zoomingBox.x + zoomingBox.width / 2,
							zoomingBox.y + zoomingBox.height / 2
						);
						const intersectionPoint = camera.getCameraPlaneIntersectionPoint(
							centerPoint,
							view
						);
						if (intersectionPoint) {
							const delta = Communicator.Point3.subtract(
								camera.getTarget(),
								intersectionPoint
							);
							camera.dolly(delta);
						}
						view.setCamera(camera);
						this.zoom(curRatio);
					}
				},

				crossSectionInitHandlers: function (crossSectionDialog) {
					var self = this;

					self.bindUnpressedState(
						self.toolbarContainer.viewToolbar.btnCrossSection,
						crossSectionDialog
					);

					crossSectionDialog.onXButtonClick = function () {
						self.setCrossSectionOrientation('AxisX');
					};
					crossSectionDialog.onYButtonClick = function () {
						self.setCrossSectionOrientation('AxisY');
					};
					crossSectionDialog.onZButtonClick = function () {
						self.setCrossSectionOrientation('AxisZ');
					};
					crossSectionDialog.onPButtonClick = function () {
						self.setCrossSectionOrientation('SelectFaceNormal');
					};
					crossSectionDialog.onIXButtonClick = function () {
						self.setCrossSectionOrientation('InvertX');
					};
					crossSectionDialog.onIYButtonClick = function () {
						self.setCrossSectionOrientation('InvertY');
					};
					crossSectionDialog.onIZButtonClick = function () {
						self.setCrossSectionOrientation('InvertZ');
					};
					crossSectionDialog.onIPButtonClick = function () {
						self.setCrossSectionOrientation('InvertFace');
					};
					crossSectionDialog.onHasSelectedFace = function () {
						var selectionItem = self.viewer.getSelectionManager().getLast();
						var faceSelection =
							selectionItem !== null && selectionItem.getFaceEntity() !== null;

						return faceSelection;
					};
					crossSectionDialog.onShowCappingGeometry = function (visible) {
						self.viewer
							.getCuttingManager()
							.setCappingGeometryVisibility(visible);
					};
					crossSectionDialog.onToggleCuttingPlaneVisibility = function () {
						self.cuttingPlaneControl.onCuttingPlaneVisibilityToggle();
					};
					crossSectionDialog.onToggleCuttingPlaneSection = function () {
						self.cuttingPlaneControl.onCuttingPlaneSectionToggle();
					};
					crossSectionDialog.onSetCuttingPlaneVisibility = function (visible) {
						self.cuttingPlaneControl.setCuttingPlaneVisibility(visible);
					};
					crossSectionDialog.onSetCuttingPlaneSectionMode = function (
						useIndividual
					) {
						self.cuttingPlaneControl.setCuttingPlaneSectionMode(useIndividual);
					};
					crossSectionDialog.onClose = function () {
						if (!this.hasActivatedPlanes()) {
							self.viewer.getCuttingManager().deactivateCuttingSections();
						}
					};
					crossSectionDialog.onCrossClick = function () {
						self.viewer.getCuttingManager().deactivateCuttingSections();
					};

					self.setCrossSectionOrientation('AxisZ');
					crossSectionDialog.isInitHandlers = true;
				},

				explodedViewClick: function () {
					var self = this;

					var explodedDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Exploded
					);

					if (!explodedDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnExplodedView,
							explodedDialog
						);

						explodedDialog.changeSliderPosition = function () {
							self.explodedView(this.sliderValue / 50);
							var existMeasurements = self.viewer
								.getMeasureManager()
								.getAllMeasurements().length;
							self.DialogManager.setVisibilityOfMeasureButtons(
								existMeasurements
							);
						};
						explodedDialog.onCrossClick = function () {
							this.sliderValue = 0;
							self.explodedView(this.sliderValue);
							self.viewer.getExplodeManager().stop();
						};

						explodedDialog.isInitHandlers = true;

						var explodeManager = this.viewer.getExplodeManager();
						if (!explodeManager.getActive()) {
							this.viewer.getExplodeManager().start();
						}
					}
				},

				// The level is an integer with a value between 0 and 100
				explodedView: function (level) {
					this.viewer.getExplodeManager().setMagnitude(level);
				},

				showModelBrowser: function (dialogName) {
					var self = this;

					var modelBrowser = this.DialogManager.getExistingOrNewDialog(
						dialogName
					);
					if (!modelBrowser.isInitHandlers) {
						this.bindUnpressedState(
							this.toolbarContainer.viewToolbar.btnModelBrowser,
							modelBrowser
						);

						modelBrowser.isInitHandlers = true;
					}
				},

				zoom: function (zoomValue) {
					let view = this.viewer.getView();
					let camera = view.getCamera();

					camera.setWidth(camera.getWidth() * zoomValue);
					camera.setHeight(camera.getHeight() * zoomValue);

					const position = camera.getPosition();
					const target = camera.getTarget();

					const newDelta = Communicator.Point3.subtract(target, position).scale(
						zoomValue
					);
					camera.setPosition(Communicator.Point3.subtract(target, newDelta));

					view.setCamera(camera);
				},

				getSnapshotPage: function () {
					var img = document.createElement('img');
					img.src = this.snapshotImage.src;

					var width =
						this.snapshotContainer.style.display === 'none'
							? this.viewerContainer.offsetWidth
							: this.snapshotImage.offsetWidth;
					var height =
						this.snapshotContainer.style.display === 'none'
							? this.viewerContainer.offsetHeight
							: this.snapshotImage.offsetHeight;

					return this.getCanvDataUrl(img, width, height);
				},

				showSnapshot: function () {
					if (this.snapshotUrl) {
						this.inherited(arguments);
					} else {
						VC.Utils.AlertError(
							VC.Utils.GetResource('snapshot_can_not_be_created')
						);
						return;
					}
				},

				hideViewer: function () {
					// We can not set a display:none for iframe before snapshot creation due to the bug in Firefox below
					// Bug 941146 - NS_ERROR_FAILURE when other browsers work fine when setting font on a canvas context in a display:none iframe
					//this.viewerContainer.style.display = "none";
				},

				resetViewBase: function (modelBrowserId) {
					// "Reset View" command also should cancel active "Cross Section" dialog
					var curDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.CrossSection
					);
					if (curDialog) {
						curDialog.onCrossClick();
					}

					// "Reset View" command also should cancel active "Exploded View" dialog
					curDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Exploded
					);
					if (curDialog) {
						curDialog.onCrossClick();
					}

					this.DialogManager.closeAllDialogsButThis(modelBrowserId);
					this.viewer.getModel().resetModelTransparency();
				},

				getMarkupImg: function () {
					var canvasSize = this.viewer.getView().getCanvasSize();

					var snapshotConfig = new Communicator.SnapshotConfig(
						canvasSize.x,
						canvasSize.y
					);
					return this.viewer.takeSnapshot(snapshotConfig);
				},

				onWindowResizeEventHandler: function () {
					if (this.viewer && this.isStarted) {
						this.resizeContent();
					}
					this.inherited(arguments);
				},

				restoreModelBrowserButtonState: function (dialogName) {
					if (this.viewerToolbar.btnModelBrowser) {
						const curState = this.restoreViewerParameter(
							this.type + '.' + dialogName
						);
						if (curState !== null && curState.localeCompare('On') === 0) {
							this.viewerToolbar.btnModelBrowser.onClick();
						}
					}
				},

				getCustomViews: function () {
					var returnedArray = [];
					var viewData = null;
					var cadView = null;
					var isAnnotationView = null;
					var model = this.viewer.getModel();
					var cadViews = model.getCadViews(); // { string(cad view id): string(label) , ...}
					var keys = Object.keys(cadViews);

					if (keys.length > 0) {
						for (var i = 0; i < keys.length; i++) {
							isAnnotationView = model.isAnnotationView(+keys[i]);
							var parsedCadViewLabel = cadViews[keys[i]].split(
								this.annotationLabelSuffix
							)[0];
							viewData = {
								id: +keys[i],
								viewType: isAnnotationView ? 'annotationViews' : 'cadViews',
								label: parsedCadViewLabel
							};
							returnedArray.push(viewData);
						}
					}

					return returnedArray;
				},

				applyCustomView: function (cadViewId) {
					var handleOperator = this.viewer
						.getOperatorManager()
						.getOperator(Communicator.OperatorId.Handle);
					handleOperator.removeHandles();

					var faceAxisIndex = VC.Utils.Enums.AxisIndex.Face;
					var faceSection = this.viewer
						.getCuttingManager()
						.getCuttingSection(faceAxisIndex);

					this.viewer.getModel().activateCadView(+cadViewId);
					if (faceSection.getCount()) {
						this.cuttingPlaneControl.setAxisStatus(
							faceAxisIndex,
							VC.Utils.Enums.CuttingPlaneStatuses.Hidden
						);
						this.cuttingPlaneControl.setCadViewActivated(true);
						this.cuttingPlaneControl.setCuttingPlaneVisible(
							true,
							faceAxisIndex
						);
					}
				},

				onAfterShowModelBrowserHandler: function (dialogName) {
					this.adjustViewerContainerStyles(true, dialogName);

					this.saveViewerParameter(this.type + '.' + dialogName, 'On', true);
				},

				onAfterHideModelBrowserHandler: function (dialogName) {
					this.adjustViewerContainerStyles(false, dialogName);

					this.saveViewerParameter(this.type + '.' + dialogName, 'Off', true);
				},

				initViewerContent: function (modelBrowserPanel, htmlContainer) {
					this.content = new BorderContainer(
						{
							design: 'headline',
							gutters: false,
							style: 'height: 100%; z-index: 999'
						},
						htmlContainer.OverflowContainer
					);

					var viewerContainerPane = new ContentPane(
						{
							region: 'center',
							splitter: true,
							style: 'z-index: 999; padding: 0'
						},
						htmlContainer.ViewerContainer
					);

					this.content.addChild(modelBrowserPanel);
					this.content.startup();
					this.assignModelBrowserHandlers(modelBrowserPanel);
					this.setSplitterVisibility(modelBrowserPanel.isOpened);
					this.content.resize();
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

				disableMultiplePartSelection: function () {
					var self = this;

					var _inputMonitorMouseUp = this.viewer._inputMonitor._processMouseUp;
					if (_inputMonitorMouseUp) {
						this.viewer._inputMonitor._processMouseUp = function (mouseEvent) {
							if (mouseEvent.button === Communicator.Button.Left) {
								self.viewer.getSelectionManager().clear();
							}

							_inputMonitorMouseUp.apply(self.viewer._inputMonitor, arguments);
						};
					}

					//Hoops-specific implementation for IE/EDGE
					var _inputMonitorPointerUp = this.viewer._inputMonitor
						._processPointerUp;
					if (_inputMonitorPointerUp) {
						this.viewer._inputMonitor._processPointerUp = function (
							mouseEvent
						) {
							if (mouseEvent.button === Communicator.Button.Left) {
								self.viewer.getSelectionManager().clear();
							}

							_inputMonitorPointerUp.apply(
								self.viewer._inputMonitor,
								arguments
							);
						};
					}
				},

				loadCameraFromViewState: function (viewStateData) {
					var cameraStr = viewStateData.getValue('camera');
					if (cameraStr !== '') {
						this.viewer
							.getView()
							.setCamera(
								new Communicator.Camera.fromJson(JSON.parse(cameraStr))
							);
					}
				},

				getZoomToMousePosition: function (propertyName) {
					const zoomToCursorPreferenceValue = this.aras.getPreferenceItemProperty(
						'SSVC_Preferences',
						null,
						propertyName
					);

					return Boolean(+zoomToCursorPreferenceValue);
				},

				setZoomToMousePosition: function (isZoomToCursor) {
					const operatorManager = this.viewer.getOperatorManager();
					const zoomOperator = operatorManager.getOperator(
						Communicator.OperatorId.Zoom
					);

					zoomOperator.setZoomToMousePosition(isZoomToCursor);
				},

				getCurrentZoomToMousePosition: function () {
					const operatorManager = this.viewer.getOperatorManager();
					const zoomOperator = operatorManager.getOperator(
						Communicator.OperatorId.Zoom
					);

					return zoomOperator.getZoomToMousePosition();
				},

				setZoomToMousePositionFromDatabase: function (propertyName) {
					const isZoomToCursor = this.getZoomToMousePosition(propertyName);

					this.setZoomToMousePosition(isZoomToCursor);
				},

				updateZoomToCursorPreference: function (propertyName, propertyValue) {
					const preference = {};
					preference[propertyName] = propertyValue ? '1' : '0';

					this.aras.setPreferenceItemProperties(
						'SSVC_Preferences',
						null,
						preference
					);
					this.aras.savePreferenceItems();
				},

				switchToDefaultMode: function () {
					let btnZoomWindow = this.toolbarContainer.viewToolbar.btnZoomWindow;
					if (btnZoomWindow && btnZoomWindow.IsPressed) {
						btnZoomWindow.SetPressedState(false);
						this.zoomWindow = false;
						this.cleanZoomingPage();

						if (this.onZoomModeDispose) {
							this.onZoomModeDispose();
						}
					}
				},

				_toViewMode: function () {
					this.hideSnapshot();
					this.showViewer();
					this.cleanMarkupPage();
					this.ToolbarManager.currentContainer.closeAllPalettesButThis('');
					if (this.toolbarContainer.viewToolbar) {
						this.toolbarContainer.btnView.select();
						this.toolbarContainer.activeMode = this.mode;
						this.toolbarContainer.markupToolbar.hide();
					}
					if (this.args.markupMessageId !== undefined) {
						this.args.markupMessageId = undefined;
					}
					if (this.onViewModeActivate) {
						this.onViewModeActivate();
					}
				}
			});
		})()
	);
});
