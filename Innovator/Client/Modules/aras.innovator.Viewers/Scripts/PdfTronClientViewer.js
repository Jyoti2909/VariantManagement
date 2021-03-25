/// <reference path="Widgets/ComparePalleteDialog.js" />
VC.Utils.Page.LoadModules(['PdfTronViewerBase']);

require(['dojo/aspect', 'dojox/xml/parser', 'dojo/_base/declare'], function (
	aspect,
	parser,
	declare
) {
	VC.Utils.Page.LoadModules(['PdfTronWrapper']);

	return dojo.setObject(
		'VC.PdfTronClientViewer',
		(function () {
			var intervalObject = {};
			return declare('PdfTronClientViewer', VC.PdfTronViewerBase, {
				measureContainer: null,
				restoredViewStateData: null,
				viewStateDataApplying: false,
				isDocumentLoaded: false,
				initialLoading: false,
				isRendering: false,
				iFrame: null,
				docViewerPageContainer: null,
				layersList: null,
				layersOnOffOptions: '',
				layersContext: null,
				defaultLayersList: null,
				viewerLoadedProgress: 10, // Assume a loading progress is 10% when the viewer is ready, before a document is loaded
				documentLoadedProgress: 70, // Allocate a 70% of the loading progress for the document loading
				showLoadingProgress: false,
				scrollPositionTop: 0,
				scrollPositionLeft: 0,
				disableAnnotationsInteraction: false,
				maxZoom: null,
				serverMaxZoom: null,
				messageId: null,
				systemDPI: null,
				customDPI: null,
				onSelectModeSelected: null,
				onZoomModeSelected: null,
				onZoomModeDispose: null,
				onInitTempViewer: function (viewename, args) {},
				onBindDocumentVersions: function (args) {},
				onRestoreComparisonData: function (fileInfo1, fileInfo2) {},
				onHandleScrollStateEvent: function (args) {},

				constructor: function (args) {
					this.type = this.DialogManager.viewerType = 'pdf';
					this.args = args;
					this.serverMaxZoom = args.maxZoom;
					this.cData = args.cData;
					this.cDataErrorInfo = args.cDataErrorInfo;

					VC.Utils.addClass(this.viewerContainer, 'PdfViewerContainer');
					VC.Utils.addClass(this.snapshotContainer, 'PdfSnapshotContainer');

					Object.defineProperty(this, 'hasHorizontalScroll', {
						get: function () {
							var returnedValue = false;

							if (this.docViewerEl) {
								returnedValue =
									this.docViewerEl.scrollWidth >
									this.viewerContainer.clientWidth;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'hasVerticalScroll', {
						get: function () {
							var returnedValue = false;

							if (this.docViewerEl) {
								returnedValue =
									this.viewerContainer.scrollHeight >
									this.viewerContainer.clientHeight;
							}

							return returnedValue;
						}
					});

					Object.defineProperty(this, 'isViewerContainerDisplayed', {
						get: function () {
							return this.viewerContainer.style.zIndex === '1';
						},
						configurable: true
					});
				},

				initializeViewer: function () {
					var self = this;

					//var cData = VC.Utils.getPdfFileInfo(this.fileUrl, VC.Utils.Enums.PdfHandlerActions.ClientData)
					if (
						typeof this.cData === 'undefined' ||
						this.cData === null ||
						this.cData === ''
					) {
						//Show Licence error message only in case if server has not returned error message
						if (
							this.cDataErrorInfo == null ||
							this.cDataErrorInfo.errorMsg == null
						) {
							VC.Utils.AlertError(
								VC.Utils.GetResource('pdfv_license_is_invalid')
							);
						}

						return;
					}
					var pdfInitOptions = {
						ui: 'legacy',
						type: 'html5',
						documentType: 'pdf',
						hideAnnotationPanel: true,
						showToolbarControl: false,
						path:
							self.args.baseUrl +
							'/Modules/aras.innovator.Viewers/Scripts/3rdPartyLibs/pdftronwebviewer-v2.2/lib',
						pdfBackend: VC.Utils.Viewers.PDFViewerSettings.pdfBackend,
						preloadPDFWorker: false /*,
					l: cData*/
					};

					self.setAnnotationsMode(pdfInitOptions);

					this.viewer = new VC.WebViewer.PdfTronWrapper(
						pdfInitOptions,
						this.viewerContainer
					);

					this.viewerContainer.addEventListener(
						'ready',
						dojo.hitch(this, this.onViewerReady)
					);
					this.viewerContainer.addEventListener(
						'documentLoaded',
						dojo.hitch(this, this.onViewerLoaded)
					);
					this.viewerContainer.addEventListener(
						'pageChanged',
						dojo.hitch(this, this.onPageChangeEventHandler)
					);
					this.viewerContainer.addEventListener(
						'zoomChanged',
						dojo.hitch(this, this.onZoomChangeEventHandler)
					);

					this.hidden = false;
					this.initLoadingProgress(0);
					this.systemDPI = VC.Utils.getXYDPIs()[0];
				},

				setAnnotationsMode: function (pdfOptions) {
					var enableAnnotations = VC.ViewerAgent.getBooleanVariable(
						VC.Utils.Enums.ServerVariable.PDFEnableAnnotations
					);

					this.disableAnnotationsInteraction = enableAnnotations;
					pdfOptions.enableAnnotations = enableAnnotations;
					pdfOptions.enableReadOnlyMode = enableAnnotations;
				},

				getDocumentLayers: function (url) {
					var self = this;
					var document = self.readerControl.docViewer.getDocument();

					document.getLayersArray().then(function (layerData) {
						self.layersContext = layerData;

						document.setLayersArray(self.layersContext);
						self.readerControl.docViewer.refreshAll();
						self.readerControl.docViewer.updateView();

						var resultLayers = [];
						for (var i = 0; i < self.layersContext.length; i++) {
							resultLayers.push({
								title: self.layersContext[i].name,
								value: self.layersContext[i].obj,
								checked: self.layersContext[i].visible + ''
							});
						}

						self.layersList = JSON.stringify(resultLayers);
						self.defaultLayersList = JSON.stringify(resultLayers);

						self.setBtnLayersAccessibility();
						self.applyViewStateData();
					});
				},

				_loadFile: function () {
					if (this.isViewerInitialized) {
						this.viewer.loadDocument(this.fileUrl);
					}
				},

				_toMarkupMode: function () {
					this.setScrollPositionToViewState();
					this.inherited(arguments);
				},

				_toViewMode: function () {
					// IR-039935 "CHROME: SSVC. Black snapshot when switching between modes"
					if (this.isBtnMarkupEnabled()) {
						this.isRendering = true;
						this.toolbarContainer.btnMarkup.enable(false);
					}

					if (!this.isViewerInitialized) {
						this.initializeViewer();
					} else {
						this.showLoadingProgress = true;
					}

					this.hideSnapshot();
					this.showViewer();
					this.cleanMarkupPage();
					this.toolbarContainer.closeAllPalettesButThis('');
					if (this.toolbarContainer.viewToolbar) {
						this.toolbarContainer.btnView.select();
						this.toolbarContainer.activeMode = this.mode;
						this.toolbarContainer.markupToolbar.hide();
					}
					if (this.restoredViewStateData) {
						this.viewStateData.innerString = this.restoredViewStateData;
						this.restoredViewStateData = null;
					}
					if (this.isDocumentLoaded) {
						this.applyViewStateData();
					}

					if (this.args.markupMessageId !== undefined) {
						this.args.markupMessageId = undefined;
					}
					if (this.onViewModeActivate) {
						this.onViewModeActivate();
					}
					this.clearDiscussionFeedTextbox();
				},

				displayMarkup: function (imgUrl) {
					this.snapshotUrl = imgUrl;
					this.mode = this.ViewerModes.Markup;
				},

				reloadDocument: function (layers) {
					if (layers === null || layers === '') {
						return;
					}
					if (this.layersContext === null) {
						return;
					}

					var inputLayers = layers.split(';');

					for (var j in inputLayers) {
						var state = false;
						var layerName = inputLayers[j];

						if (layerName.lastIndexOf('&&') === layerName.length - 2) {
							layerName = layerName.substring(0, layerName.length - 2);
							state = true;
						}

						for (var layer in this.layersContext) {
							if (this.layersContext[layer].name === layerName) {
								this.layersContext[layer].visible = state;

								break;
							}
						}
					}
					var document = this.readerControl.docViewer.getDocument();
					document.setLayersArray(this.layersContext);
					this.readerControl.docViewer.refreshAll();
					this.readerControl.docViewer.updateView();

					this.layersOnOffOptions = layers;
				},

				updateLayersDialog: function (strLayers) {
					if (this.layersList === null || this.layersList === '') {
						return;
					}

					var inputLayers = strLayers.split(';');
					var resultLayers = JSON.parse(this.layersList);

					for (var j in inputLayers) {
						var state = false;
						var layerName = inputLayers[j];

						if (layerName.lastIndexOf('&&') === layerName.length - 2) {
							layerName = layerName.substring(0, layerName.length - 2);
							state = true;
						}

						for (var layer in resultLayers) {
							var currentLayer = resultLayers[layer];
							if (currentLayer.title.localeCompare(layerName) === 0) {
								currentLayer.checked = state.toString();

								break;
							}
						}
					}

					this.layersList = JSON.stringify(resultLayers);
					var layersDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Layers
					);

					if (layersDialog) {
						layersDialog.constructLayers(this.layersList);
					}
				},

				// Reset the layer's visibility to what is saved inside the PDF file
				resetLayersDialog: function () {
					this.setBtnLayersAccessibility();

					var layersDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Layers
					);

					if (layersDialog && this.defaultLayersList) {
						layersDialog.constructLayers(this.defaultLayersList);
					}
				},

				adjustDocPad: function () {
					// Adjust the document padding to centre the content.
					var pad = 0;
					var dpad = this.iFrame.contentDocument.getElementById('docpad');
					if (dpad === null) {
						return;
					}

					var docHeight = $(this.docViewerEl).height();
					var height = $(this.docViewerPageContainer).height();
					if (docHeight > height) {
						pad = (docHeight - height) / 2;
					}

					dpad.style.marginBottom = parseInt(pad, 10) + 'px';

					if (this.measureContainer !== null) {
						this.measureContainer.resizeSvgPage(
							this.viewerContainer.firstElementChild.contentWindow.document
						);
					}
				},

				setViewState: function (val) {
					this.restoredViewStateData = val;

					this.inherited(arguments);
				},

				isOutOfContextMode: function () {
					return this.fileUrl == null;
				},

				onViewerReady: function () {
					this.isViewerInitialized = true;
					if (!this.mode) {
						this.mode = this.ViewerModes.View;
					}
					this.initialLoading = true;
					this.initReaderControl();
					// IR-039211 "SSVC: Remove "Initializing" bar and combine with progress bar"
					this.readerControl.showProgress = function () {};

					// File loading should be started after removing "Initializing" bar
					this._loadFile();

					this.viewer.on(
						'pageComplete',
						dojo.hitch(this, this.onPageCompleteEventHandler)
					);

					// We should replace original 'notify' event handler
					this.viewer.off('notify');
					this.viewer.on('notify', dojo.hitch(this, this.getNotifyFunction));

					this.viewer.watchOnViewerRendering(function (isRendering) {
						this.toolbarContainer.btnMarkup.enable(
							!isRendering && !this.isOutOfContextMode()
						);
						this.isRendering = isRendering;

						if (this.disableAnnotationsInteraction && !isRendering) {
							var containers = this.viewerContainer.firstElementChild.contentWindow.document.querySelectorAll(
								'[id^=pageWidgetContainer] div'
							);
							for (var i = 0; i < containers.length; i++) {
								VC.Utils.setAttribute(
									containers[i].getElementsByTagName('input'),
									'readonly',
									true
								);
								VC.Utils.setAttribute(
									containers[i].getElementsByTagName('textarea'),
									'readonly',
									true
								);
								VC.Utils.setAttribute(
									containers[i].querySelectorAll('input[type=checkbox]'),
									'disabled',
									true
								);
							}
						}
					}, this);

					this.iFrame = this.viewerContainer.firstElementChild;
					this.iFrame.contentWindow.addEventListener(
						'resize',
						dojo.hitch(this, this.adjustDocPad)
					);
					this.iFrame.contentWindow.addEventListener(
						'keypress',
						dojo.hitch(this, this.onKeyPressDocContainer)
					);
					this.docViewerEl = this.iFrame.contentDocument.getElementById(
						'DocumentViewer'
					);
					this.docViewerPageContainer = this.iFrame.contentDocument.getElementById(
						'viewer'
					);
					this.setupZoomLevelBounds();
					this.setLoadingProgress(this.viewerLoadedProgress);

					this.iFrame.contentWindow.focus(); //FF
					this.docViewerEl.focus(); //IE

					var params = {};
					params.viewStateData = this.viewStateData;
					params.docViewerEl = this.docViewerEl;
					this.onHandleScrollStateEvent(params);
				},

				restoreViewerState: function () {
					// Custom DPI should be restored before opening Zoom dialog
					var curState = this.restoreViewerParameter(
						this.type +
							'.' +
							VC.Utils.Enums.Dialogs.Preferences +
							'.' +
							'Custom'
					);
					if (curState !== null && curState.localeCompare('On') === 0) {
						this.customDPI = this.restoreViewerParameter(
							this.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Scaling'
						);
						this.changeCustomDPI(this.customDPI);
					}

					curState = this.restoreViewerParameter(
						this.type + '.' + VC.Utils.Enums.Dialogs.Find
					);
					if (curState !== null && curState.localeCompare('On') === 0) {
						this.toolbarContainer.viewToolbar.btnFind.onClick();
					}

					curState = this.restoreViewerParameter(this.type + '.ActivePalette');
					if (curState !== null) {
						this.cursorMode = curState;
					}
				},

				onViewerLoaded: function () {
					this.inherited(arguments);

					this.isDocumentLoaded = true;
					this.viewer.margin = 2;
					this.viewer.setToolbarVisibility(false);
					this.viewer.setSideWindowVisibility(false);
					this._initPageNumberTextBox();
					this._initZoomTextBox();

					this.setViewerModes();

					this.applyViewStateData();
					this.setLoadingProgress(
						this.viewerLoadedProgress + this.documentLoadedProgress
					);

					if (this.OnLoaded) {
						this.OnLoaded();
					}

					if (this.initialLoading) {
						this.initialLoading = false;
						this.restoreViewerState();
					}

					var copyButton = this.iFrame.contentDocument.getElementById(
						'copyButton'
					);
					if (copyButton) {
						copyButton.style.display = 'none';
					}
				},

				_initPageNumberTextBox: function () {
					if (this.toolbarContainer.viewToolbar.ntbPageNumber) {
						var pagesNumber = this.GetPageCount();
						var pagesNumberString =
							VC.Utils.Enums.KeybordsCharacter.SLASH +
							VC.Utils.Enums.KeybordsCharacter.SPACE +
							pagesNumber;

						this.toolbarContainer.viewToolbar.ntbPageNumber.currentValue = this.GetCurrentPage();
						this.toolbarContainer.viewToolbar.ntbPageNumber.setLabelAfter(
							pagesNumberString
						);
						this.toolbarContainer.viewToolbar.ntbPageNumber.maxValue = pagesNumber;
					}
				},

				_initZoomTextBox: function () {
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue,
						VC.Utils.roundZoomValue(this.GetScale())
					);
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.maxValue,
						this.maxZoom * 100
					);
				},

				loadViewerToolbar: function () {
					var self = this;

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.PdfViewerToolbar
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPageUpClick,
						dojo.hitch(self, self.PageUpClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPageDownClick,
						dojo.hitch(self, self.PageDownClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.ntbPageNumberChange,
						dojo.hitch(self, self.PageNumberChange)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnSelectTextClick,
						dojo.hitch(self, self.SelectTextClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPanClick,
						dojo.hitch(self, self.PanClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomWindowClick,
						dojo.hitch(self, self.ZoomWindowClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomDownClick,
						dojo.hitch(self, self.ZoomOut)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomUpClick,
						dojo.hitch(self, self.ZoomIn)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.tbxZoomPercentageChange,
						dojo.hitch(self, self.ZoomPercentChange)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnFitWidthClick,
						dojo.hitch(self, self.FitWidth)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnFitHeightClick,
						dojo.hitch(self, self.FitHeight)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnFindClick,
						dojo.hitch(self, self.FindClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnLayersClick,
						dojo.hitch(self, self.LayersClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnMeasureClick,
						dojo.hitch(self, self.MeasureClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnCompareClick,
						dojo.hitch(self, self.CompareClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnDownloadClick,
						dojo.hitch(self, self.DownloadClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnViewFileClick,
						dojo.hitch(self, self.PrintClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnClockwiseClick,
						dojo.hitch(self, self.RotateCW)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnCounterClockwiseClick,
						dojo.hitch(self, self.RotateCCW)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPreferencesClick,
						dojo.hitch(self, self.Preferences)
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnFind,
						VC.Utils.Enums.Dialogs.Find
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnLayers,
						VC.Utils.Enums.Dialogs.Layers
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnMeasure,
						VC.Utils.Enums.Dialogs.Measurement
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnCompare,
						VC.Utils.Enums.Dialogs.CompareFiles
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnPreferences,
						VC.Utils.Enums.Dialogs.Preferences
					);

					this.setBtnLayersAccessibility();
				},

				setBtnLayersAccessibility: function () {
					if (this.viewerToolbar.btnLayers) {
						if (
							this.layersList === null ||
							this.layersList === '' ||
							this.layersList.localeCompare('[]') === 0
						) {
							this.viewerToolbar.btnLayers.Disable();
						} else {
							this.viewerToolbar.btnLayers.Enable();
						}
					}
				},

				initITContainer: function () {
					this.inherited(arguments);

					if (this.isViewerInitialized) {
						this._initPageNumberTextBox();
						this._initZoomTextBox();
					}

					aspect.after(
						this.toolbarContainer,
						'onBtnSwitchClick',
						dojo.hitch(this, function () {
							if (
								this.toolbarContainer.viewToolbar &&
								this.toolbarContainer.viewToolbar.ntbPageNumber
							) {
								this.toolbarContainer.viewToolbar.ntbPageNumber.currentValue = this.GetCurrentPage();
							}
							this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
								VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
								VC.Utils.Enums.TPropertyName.currentValue,
								VC.Utils.roundZoomValue(this.GetScale())
							);
						})
					);
				},

				PageDownClick: function () {
					this.NextPage();
				},

				PageUpClick: function () {
					this.PreviousPage();
				},

				PageNumberChange: function () {
					this.GoToPage(
						this.toolbarContainer.viewToolbar.ntbPageNumber.currentValue
					);
				},

				ZoomPercentChange: function () {
					this.viewMode = 'SetScale';
					var zoom = this.toolbarContainer.viewToolbar.getElementPropertyValue(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue
					);
					if (zoom) {
						this.SetScale(zoom);
					}
				},

				FindClick: function () {
					var self = this;
					var findDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Find
					);

					if (!findDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnFind,
							findDialog
						);

						findDialog.onFindText = function () {
							self.Find(
								findDialog.searchValue,
								findDialog.isMatchCase,
								false,
								findDialog.isTextChanged
							);
						};
						findDialog.onFindNextMatch = function () {
							self.Find(
								findDialog.searchValue,
								findDialog.isMatchCase,
								false,
								findDialog.isTextChanged
							);
							if (findDialog.isTextChanged) {
								findDialog.isTextChanged = false;
							}
						};
						findDialog.onChangeMatchCase = function () {
							self.Find(
								findDialog.searchValue,
								findDialog.isMatchCase,
								false,
								true
							);
						};

						findDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						aspect.after(findDialog, 'onOpen', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Find,
								'On'
							);
						});

						aspect.after(findDialog, 'onClose', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Find,
								'Off'
							);
						});

						findDialog.isInitHandlers = true;
					}
				},

				LayersClick: function () {
					var layersDialog = null;
					var self = this;

					if (self.layersList === null || self.layersList === '') {
						self.layersList = '[]';
					}

					layersDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Layers,
						self.layersList
					);

					if (!layersDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnLayers,
							layersDialog
						);

						layersDialog.onChange = function (strLayers) {
							self.layersList = strLayers;

							var retStr = collectLayersString();
							self.reloadDocument(retStr);

							if (retStr !== '') {
								self.viewStateData.updateValue('layers', retStr);
							}
						};

						layersDialog.onReset = function () {
							self.resetLayersDialog();
						};

						layersDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						layersDialog.isInitHandlers = true;
					}

					function collectLayersString() {
						var resultLayers = JSON.parse(self.layersList);

						var retStr = '';
						for (var layer in resultLayers) {
							if (retStr !== '') {
								retStr += ';';
							}
							retStr += resultLayers[layer].title;
							if (resultLayers[layer].checked) {
								retStr += '&&';
							}
						}

						return retStr;
					}
				},

				MeasureClick: function () {
					var self = this;
					var measureDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Measurement
					);

					if (self.measureContainer === null) {
						var frameDocument =
							self.viewerContainer.firstElementChild.contentDocument;
						VC.Utils.Page.LoadWidgets(['MeasureContainer']);
						var measureContainer = new VC.Widgets.MeasureContainer();
						measureContainer.placeAt(frameDocument);

						self.measureContainer = measureContainer;

						VC.Utils.Page.LoadStyles(
							frameDocument,
							'../../../../../styles/Measure.css'
						);
						VC.Utils.Page.LoadStyles(
							frameDocument,
							'../../../../../styles/svgSettings.css'
						);
					}

					if (!measureDialog.isInitHandlers) {
						measureDialog.initMeasurementUnits(self.getViewerType());
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnMeasure,
							measureDialog
						);

						measureDialog.onClearStartPoint = function () {
							self.measureContainer.clearStartPoint();
						};

						measureDialog.onClearEndPoint = function () {
							self.measureContainer.clearEndPoint();
						};

						measureDialog.onResetPoints = function () {
							self.measureContainer.clearStartPoint();
							self.measureContainer.clearEndPoint();
						};

						measureDialog.onRecordMeasurement = function () {
							self.setScrollPositionToViewState();
							var textContent = self.measureContainer.measureMessageTemplate.Format(
								this.straightLine.toPrecision(3),
								this.differenceX.toPrecision(3),
								this.differenceY.toPrecision(3),
								this.abbreviation,
								this.scale
							);
							var smProperties = {
								snapshotUrl: self.getMarkupImg(),
								markupData: self.markupData,
								comments: textContent
							};
							self.onRecordMeasurmentClick(smProperties);

							self.measureContainer.clearStartPoint();
							self.measureContainer.clearEndPoint();
							measureDialog.resetDialog();
						};

						measureDialog.onSelectMeasurementUnit = function () {
							self.recalculateMeasurements();

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Measurement +
									'.' +
									'Unit',
								measureDialog.ratioToInch
							);
						};

						measureDialog.onChangeScaleValue = function () {
							self.recalculateMeasurements();

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Measurement +
									'.' +
									'Scale',
								measureDialog.scale
							);
						};

						measureDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						aspect.after(measureDialog, 'onOpen', function () {
							// We should remove zooming page
							if (self.zoomWindow) {
								self.cleanZoomingPage();
							}

							self.measureContainer.startDrawing();
						});

						aspect.after(measureDialog, 'onClose', function () {
							self.measureContainer.clearAll();
							self.measureContainer.svgPageContainer.style.display = 'none';
							measureDialog.resetDialog();

							// We should restore zooming page
							if (self.zoomWindow) {
								self._toZoomMode();
							}
						});

						var curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Measurement +
								'.' +
								'Unit'
						);
						if (curValue !== null) {
							measureDialog.ratioToInch = curValue;
							measureDialog.selectMeasurementUnit(curValue);
						}

						curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Measurement +
								'.' +
								'Scale'
						);
						if (curValue !== null) {
							measureDialog.scale = curValue;
						}

						measureDialog.isInitHandlers = true;
					}

					self.measureContainer.onStartPointChange = function (x, y) {
						var screenRes = self.systemDPI;
						var curScale = self.GetScale() / 100.0;
						var docScale = measureDialog.scale;

						if (self.customDPI) {
							screenRes = self.customDPI;
						}

						if (docScale === 0) {
							docScale = 1.0;
						}

						measureDialog.startPointX =
							(x / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
						measureDialog.startPointY =
							(y / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
					};

					self.measureContainer.onEndPointChange = function (x, y) {
						var screenRes = self.systemDPI;
						var curScale = self.GetScale() / 100.0;
						var docScale = measureDialog.scale;

						if (self.customDPI) {
							screenRes = self.customDPI;
						}

						if (docScale === 0) {
							docScale = 1.0;
						}

						measureDialog.endPointX =
							(x / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
						measureDialog.endPointY =
							(y / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
					};
				},

				recalculateMeasurements: function () {
					var startX;
					var startY;
					var startPoint = this.measureContainer.getStartPoint();
					var endPoint = this.measureContainer.getEndPoint();

					if (startPoint) {
						startX = startPoint.startX;
						startY = startPoint.startY;

						this.measureContainer.onStartPointChange(startX, startY);
					}

					if (endPoint) {
						startX = endPoint.startX;
						startY = endPoint.startY;

						this.measureContainer.onEndPointChange(startX, startY);
					}
				},

				CompareClick: function () {
					var self = this;
					var compareDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.CompareFiles
					);

					if (!compareDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnCompare,
							compareDialog
						);

						compareDialog.onStartComparison = function () {
							self.updateFilesInfo();
							self.updateComparisonData();

							self.initComparisonViewer(false);
							self.clearComparisonData();
						};

						compareDialog.onStartComparisonDiffVersion = function () {
							var pageNum = self.GetCurrentPage();
							var pageCount = VC.Utils.getPdfFileInfo(
								self.comparisonManager.currentFile,
								VC.Utils.Enums.PdfHandlerActions.PageCount
							);

							self.comparisonManager.currentFile.filePage = pageNum;
							self.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
								self.comparisonManager.currentFile
							);

							if (pageNum > pageCount) {
								VC.Utils.AlertWarning(
									VC.Utils.GetResource('pdfv_page_not_found').Format(
										self.comparisonManager.currentFile.fileVersion,
										pageNum
									)
								);
								return false;
							}

							self.updateFilesInfo();
							self.clearComparisonData();
							self.initComparisonViewer(true);
						};

						compareDialog.onSelectAnotherItem = function () {
							var deletedObj = compareDialog.getMarkedAsDelete();
							for (var i = 0; i < deletedObj.length; i++) {
								self.comparisonManager.cleanFileInfoByName(
									deletedObj[i].fileName
								);
							}

							self.updateFilesInfo();
							self.updateComparisonData();
						};

						aspect.after(compareDialog, 'onCrossClick', function () {
							if (compareDialog.getMarkedAsDelete().length > 1) {
								self.clearComparisonData();
							}
						});

						compareDialog.onSelectDiffVersion = function (version, fileName) {
							if (version === '') {
								return;
							}

							var pageNum = self.GetCurrentPage();

							self.comparisonManager = self.onSetComparisonData({
								currentList: 1,
								filePage: pageNum,
								fileVersion: version,
								fileName: fileName
							});
							var pageCount = VC.Utils.getPdfFileInfo(
								self.comparisonManager.currentFile,
								VC.Utils.Enums.PdfHandlerActions.PageCount
							);

							if (pageNum > pageCount) {
								VC.Utils.AlertWarning(
									VC.Utils.GetResource('pdfv_page_not_found').Format(
										version,
										pageNum
									)
								);
								return;
							}

							self.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
								self.comparisonManager.currentFile
							);
						};

						compareDialog.onPageChange = function () {
							var fileInfo = null;
							if (compareDialog.dvStartComparison.disabled) {
								fileInfo = self.comparisonManager.currentFile;
							} else {
								fileInfo = self.comparisonManager.getAnotherFileInfo();
							}
							fileInfo.filePage = self.GetCurrentPage();

							compareDialog.updateFileInfoPage(
								fileInfo.fileName,
								fileInfo.filePage
							);
						};

						compareDialog.isInitHandlers = true;
					}

					this.updateFilesInfo = function () {
						var pageNum = this.GetCurrentPage();
						this.comparisonManager.currentFile.filePage = pageNum;
						this.comparisonManager.currentFile.angle =
							'e_' + this.viewer.getRotation() * 90;
						this.comparisonManager.currentFile.percents = this.GetScale();

						if (
							!this.comparisonManager.isFileEmpty(0) &&
							!this.comparisonManager.isFileEmpty(1) &&
							Math.abs(
								this.GetScale() -
									this.comparisonManager.getAnotherFileProperty('percents')
							) > 0.000000000001
						) {
							this.comparisonManager.currentFile = this.addPageToPNGConvertionParameters(
								this.comparisonManager.currentFile,
								this.comparisonManager.getAnotherFileInfo()
							);
						} else {
							this.comparisonManager.currentFile = this.addPageToPNGConvertionParameters(
								this.comparisonManager.currentFile
							);
						}
					};

					this.comparisonManager = this.onSetComparisonData({
						filePage: this.GetCurrentPage(),
						fileUrl: this.fileUrl,
						updateFromCache: true
					});

					// Scaling of both files is assumed to be the same;
					if (
						!this.comparisonManager.isFileEmpty(0) &&
						!this.comparisonManager.isFileEmpty(1) &&
						Math.abs(
							self.GetScale() -
								this.comparisonManager.getAnotherFileProperty('percents')
						) > 0.000000000001
					) {
						this.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
							this.comparisonManager.currentFile,
							this.comparisonManager.getAnotherFileInfo()
						);
					} else {
						this.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
							this.comparisonManager.currentFile
						);
					}

					var documentVersions = this.onBindDocumentVersions(
						this.comparisonManager.currentFile.mhitemType,
						this.comparisonManager.currentFile.mhitemConfigId,
						this.comparisonManager.currentFile.fileVersion,
						this.comparisonManager.currentFile.fileSelectorId
					);

					compareDialog.cleanFileInfo();

					for (var i = 0; i < this.comparisonManager.fileList.length; i++) {
						var fileInfo = this.comparisonManager.fileList[i];
						if (!fileInfo.isEmpty) {
							if (i >= 1) {
								compareDialog.showComparisonContent = false;
							}
							compareDialog.addFileInfo(
								fileInfo.fileName,
								fileInfo.filePage,
								fileInfo.documentName,
								fileInfo.fileVersion
							);
						}
					}

					if (compareDialog.fileInfoControls.length === 1) {
						compareDialog.fileInfoControls[0].hideButton();
					}

					compareDialog.addVersionsDefinition(documentVersions);
					compareDialog.startup();
				},

				Preferences: function () {
					var self = this;
					var preferencesDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Preferences
					);

					if (!preferencesDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnPreferences,
							preferencesDialog
						);

						preferencesDialog.onChangeScalingValue = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.changeCustomDPI(preferencesDialog.scaling);
						};

						preferencesDialog.onSelectDefaultResolution = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Custom',
								'Off'
							);
							self.deleteViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Scaling'
							);
							self.changeCustomDPI(self.systemDPI);
						};

						preferencesDialog.onSelectCustomResolution = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Custom',
								'On'
							);
							if (preferencesDialog.scaling) {
								self.changeCustomDPI(preferencesDialog.scaling);
							}
						};

						preferencesDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						aspect.after(preferencesDialog, 'onOpen', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Preferences,
								'On'
							);
						});

						aspect.after(preferencesDialog, 'onClose', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Preferences,
								'Off'
							);
						});

						var curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Custom'
						);
						if (curValue !== null && curValue.localeCompare('On') === 0) {
							preferencesDialog.customResolution.isChecked = true;
							preferencesDialog.showScale();
						} else {
							preferencesDialog.scaling = self.systemDPI;
						}

						curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Scaling'
						);
						if (curValue !== null && curValue !== '') {
							preferencesDialog.scaling = curValue;
						}

						preferencesDialog.isInitHandlers = true;
					}
				},

				changeCustomDPI: function (scaling) {
					var curDPI = this.customDPI;
					var curScale = this.GetScale();

					this.customDPI = scaling;

					// We should change zoom level to keep PDF document in appropriate fit mode if it was previously selected.
					// Otherwise we should change PDF document size to keep current zoom level.
					if (this.viewMode === 'FitWidth' || this.viewMode === 'FitPage') {
						if (!curDPI) {
							curDPI = this.systemDPI;
						}

						if (this.customDPI && this.customDPI > 0) {
							curScale = curScale * (curDPI / this.customDPI);
						} else {
							curScale = curScale * (curDPI / this.systemDPI);
						}
					}

					this.SetScale(curScale);
					this.setupZoomLevelBounds();

					if (this.customDPI && this.customDPI > 0) {
						this.saveViewerParameter(
							this.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Scaling',
							this.customDPI
						);
					}
				},

				hideViewer: function () {
					if (this.viewerContainer) {
						this.viewerContainer.style.zIndex = '0';
					}
					this.hidden = true;
				},

				showViewer: function () {
					if (this.viewerContainer) {
						this.viewerContainer.style.zIndex = '1';
					}
					this.hidden = false;

					if (this.isDocumentLoaded) {
						this._fireResizeWindowEvent();
					}
				},

				showSnapshotContainer: function () {
					if (this.snapshotContainer) {
						this.snapshotContainer.style.zIndex = '1';
					}
				},

				hideSnapshot: function () {
					if (this.snapshotContainer) {
						this.snapshotContainer.style.zIndex = '0';
					}
				},

				applyViewStateData: function () {
					if (
						this.viewStateData.isEmpty() ||
						this.mode === this.ViewerModes.Markup
					) {
						return;
					}

					var fileInfo1 = this.viewStateData.getValue('fileInfo1');
					var fileInfo2 = this.viewStateData.getValue('fileInfo2');
					if (fileInfo1 !== '' && fileInfo2 !== '') {
						var diffVersion =
							this.viewStateData
								.getValue('diffVersion')
								.localeCompare('true') === 0;

						this.comparisonManager = this.onRestoreComparisonData(
							fileInfo1,
							fileInfo2
						);
						this.initComparisonViewer(
							diffVersion,
							true,
							this.viewStateData.innerString
						);
						this.viewStateData = new this.ViewState();

						return;
					}

					this.viewMode = 'SetScale';
					this.viewStateDataApplying = true;

					var layers = this.viewStateData.getValue('layers');

					if (layers !== '') {
						this.reloadDocument(layers);
						this.updateLayersDialog(layers);
					}

					var dpi = this.viewStateData.getValue('customDPI');
					if (dpi !== '') {
						this.customDPI = dpi;
						this.setupZoomLevelBounds();
						this.saveViewerParameter(
							this.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Scaling',
							this.customDPI
						);
					}

					var percents = this.viewStateData.getValue('percents');
					if (percents !== '') {
						this.SetScale(percents);
					}

					var angle = this.viewStateData.getValue('angle');
					if (angle === '') {
						angle = '0';
					}
					this.viewer.setRotation(angle / 90);

					var pageRegExp = new RegExp('\\d+');
					var pageResult = pageRegExp.exec(this.viewStateData.getValue('page'));

					if (pageResult !== null) {
						this.GoToPage(pageResult[0]);
					}

					var self = this;

					setTimeout(function () {
						var scroll_top = self.viewStateData.getValue('scroll_top');
						if (scroll_top !== '') {
							self.docViewerEl.scrollTop = scroll_top;
						}

						var scroll_left = self.viewStateData.getValue('scroll_left');
						if (scroll_left !== '') {
							self.docViewerEl.scrollLeft = scroll_left;
						}

						self.viewStateDataApplying = false;
					}, 1);
				},

				FitWidth: function () {
					this.viewMode = 'FitWidth';
					this.viewer.setFitMode(PDFTron.WebViewer.FitMode.FitWidth);
					this.viewStateData.updateValue('view_mode', 'FitWidth');
				},

				FitHeight: function () {
					this.viewMode = 'FitPage';
					this.viewer.setFitMode(PDFTron.WebViewer.FitMode.FitPage);
					this.viewStateData.updateValue('view_mode', 'FitHeight');
				},

				SetScale: function (percents) {
					var scale = percents / 100.0;
					if (this.customDPI && this.customDPI > 0) {
						scale = scale / (this.systemDPI / this.customDPI);
					}
					this.viewer.setZoomLevel(scale);

					// WebViewerWrapper filters one execution of zoom per 500 milliseconds
					if (this.GetScale() === percents * 1.0) {
						if (this.customDPI) {
							this.viewStateData.updateValue('customDPI', this.customDPI);
						}
						this.viewStateData.updateValue('percents', percents);
					}
				},

				GetScale: function () {
					var curScale = this.viewer.getZoomLevel();
					if (this.customDPI && this.customDPI > 0) {
						curScale = curScale * (this.systemDPI / this.customDPI);
					}

					return curScale * 100.0;
				},

				PreviousPage: function () {
					this.viewer.goToPrevPage();
				},

				NextPage: function () {
					this.viewer.goToNextPage();
				},

				FirstPage: function () {
					this.viewer.goToFirstPage();
				},

				LastPage: function () {
					this.viewer.goToLastPage();
				},

				GoToPage: function (page) {
					this.viewer.setCurrentPageNumber(page);
				},

				GetCurrentPage: function () {
					if (this.viewer) {
						return this.viewer.getCurrentPageNumber();
					}
				},

				GetPageCount: function () {
					return this.viewer.getPageCount();
				},

				onDialogKeyDown: function (event) {
					if (event.keyCode === VC.Utils.Enums.AffectedKey.PAGEUP) {
						this.PreviousPage();
					}
					if (event.keyCode === VC.Utils.Enums.AffectedKey.PAGEDOWN) {
						this.NextPage();
					}
				},

				ZoomOut: function () {
					// IR-032761: ITG Viewer: Markup doesn't match viewer after double click zoom
					if (!this.isRendering) {
						this.viewMode = 'SetScale';
						var btnMarkupState = this.isBtnMarkupEnabled();
						if (btnMarkupState) {
							this.isRendering = true;
							this.toolbarContainer.btnMarkup.enable(false);
						}

						var zoom = this.GetScale() / 100;
						if (zoom > 1.0 && zoom - 0.25 < 1.0) {
							zoom = 1.0;
						} else {
							zoom = Math.max(0.01, zoom - 0.25);
						}
						this.SetScale(zoom * 100);

						// WebViewerWrapper filters one execution of zoom per 500 milliseconds
						if (this.isRendering && this.GetScale() / 100 !== zoom) {
							this.isRendering = false;
							this.toolbarContainer.btnMarkup.enable(btnMarkupState);
						}
					}
				},

				ZoomIn: function () {
					// IR-032761: ITG Viewer: Markup doesn't match viewer after double click zoom
					if (!this.isRendering) {
						this.viewMode = 'SetScale';
						var btnMarkupState = this.isBtnMarkupEnabled();
						if (btnMarkupState) {
							this.isRendering = true;
							this.toolbarContainer.btnMarkup.enable(false);
						}

						var zoom = this.GetScale() / 100;
						if (zoom < 1.0 && zoom + 0.25 > 1.0) {
							zoom = 1.0;
						} else {
							zoom = Math.min(this.maxZoom, zoom + 0.25);
						}
						this.SetScale(zoom * 100);

						// WebViewerWrapper filters one execution of zoom per 500 milliseconds
						if (this.isRendering && this.GetScale() / 100 !== zoom) {
							this.isRendering = false;
							this.toolbarContainer.btnMarkup.enable(btnMarkupState);
						}
					}
				},

				RotateCW: function () {
					this.viewer.rotateClockwise();
					this.viewStateData.updateValue(
						'angle',
						this.viewer.getRotation() * 90
					);
				},

				RotateCCW: function () {
					this.viewer.rotateCounterClockwise();
					this.viewStateData.updateValue(
						'angle',
						this.viewer.getRotation() * 90
					);
				},

				PanClick: function () {
					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(
						false
					);
					if (this.toolbarContainer.viewToolbar.btnSelectText) {
						this.toolbarContainer.viewToolbar.btnSelectText.SetPressedState(
							false
						);
					}

					this._toPanMode();

					this.toolbarContainer.viewToolbar.btnPan.SetPressedState(true);
				},

				ZoomWindowClick: function () {
					if (this.toolbarContainer.viewToolbar.btnSelectText) {
						this.toolbarContainer.viewToolbar.btnSelectText.SetPressedState(
							false
						);
					}
					if (this.toolbarContainer.viewToolbar.btnPan) {
						this.toolbarContainer.viewToolbar.btnPan.SetPressedState(false);
					}

					this._toZoomMode();

					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(true);
				},

				SelectTextClick: function () {
					this.toolbarContainer.viewToolbar.btnPan.SetPressedState(false);
					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(
						false
					);

					this._toSelectMode();

					this.toolbarContainer.viewToolbar.btnSelectText.SetPressedState(true);
				},

				PrintClick: function () {
					VC.Utils.Page.LoadModules(['Managers/PrintManager']);
					var newFileUrl = this.aras.IomInnovator.getFileUrl(
						this.args.fileId,
						this.aras.Enums.UrlType.SecurityToken
					);
					VC.PrintManager.openPDFFile(newFileUrl, VC.PrintManager.printFile);
				},

				_toZoomMode: function () {
					var self = this;
					this.zoomWindow = true;
					this.cleanZoomingPage();
					this.addZoomingPage(
						this.docViewerEl.clientWidth,
						this.docViewerEl.clientHeight
					);

					this.zoomingPage.startSelecting();

					aspect.before(
						this.zoomingPage.container,
						'OnSelectingStart',
						function () {
							self.DialogManager.disableOpenedDialogs();
						}
					);

					aspect.before(
						this.zoomingPage.container,
						'OnSelectingEnd',
						function () {
							self.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(
								false
							);
							self.zoomWindow = false;
							self.DialogManager.enableOpenedDialogs();
							self.execZooming();
							self._toPanMode();
							if (self.toolbarContainer.viewToolbar.btnPan) {
								self.toolbarContainer.viewToolbar.btnPan.SetPressedState(true);
							}
							if (self.onZoomModeDispose) {
								self.onZoomModeDispose();
							}
						}
					);

					if (this.onZoomModeSelected) {
						this.onZoomModeSelected();
					}
				},

				_fireResizeWindowEvent: function () {
					if (document.createEvent) {
						var ev = document.createEvent('Event');
						ev.initEvent('resize', true, true);
						window.dispatchEvent(ev);
					} else {
						document.fireEvent('onresize');
					}
				},

				updateZoomingPage: function () {
					if (this.zoomingPage) {
						this.zoomingPage.position = {
							left: '0px',
							top: '0px',
							width: this.docViewerEl.clientWidth + 'px',
							height: this.docViewerEl.clientHeight + 'px'
						};

						this.zoomingPage.clientX = 0;
						this.zoomingPage.clientY = 0;
						this.zoomingPage.width = this.docViewerEl.clientWidth;
						this.zoomingPage.height = this.docViewerEl.clientHeight;
					}
				},

				execZooming: function () {
					var self = this;
					var zoomingBox = this.zoomingPage.getSelectionBox();

					if (zoomingBox && zoomingBox.width > 0 && zoomingBox.height > 0) {
						var ratioX = this.viewerContainer.clientWidth / zoomingBox.width;
						var ratioY = this.viewerContainer.clientHeight / zoomingBox.height;
						var curRatio = Math.min(ratioX, ratioY);
						var curScale = this.GetScale() * curRatio;
						if (curScale > this.maxZoom * 100) {
							curScale = this.maxZoom * 100;
							curRatio = curScale / this.GetScale();
						}

						var pageContainer = this.readerControl.getPageContainer(0);
						var view = pageContainer[0];
						// The .offsetParent should be used starting from WebViewer's version 2.2.0
						var pageTop = view.offsetParent.offsetTop;
						var viewLeft = view.offsetLeft + view.offsetParent.offsetLeft;

						var selectedRect = this.zoomingPage.container.selectionRect.Node.getBBox();
						var scroll_top =
							(this.docViewerEl.scrollTop - pageTop + zoomingBox.y) * curRatio;
						var scroll_left =
							(this.docViewerEl.scrollLeft - viewLeft + zoomingBox.x) *
							curRatio;
						var offsetX =
							(this.docViewerEl.clientWidth - selectedRect.width * curRatio) /
							2;
						var offsetY =
							(this.docViewerEl.clientHeight - selectedRect.height * curRatio) /
							2;

						if (scroll_left - offsetX >= 0) {
							scroll_left = scroll_left - offsetX;
						}

						if (scroll_top - offsetY >= 0) {
							scroll_top = scroll_top - offsetY;
						}

						this.viewMode = 'SetScale';
						this.SetScale(curScale);

						setTimeout(function () {
							pageContainer = self.readerControl.getPageContainer(0);
							view = pageContainer[0];

							self.docViewerEl.scrollTop = scroll_top;
							// This correction is for multipage files which contain pages with different width
							self.docViewerEl.scrollLeft = scroll_left + view.offsetLeft;
						}, 1);
					}
				},

				getMarkupImg: function () {
					// IR-033937 "ITG Viewer: Incorrect viewer state after switch from markup"
					if (this.customDPI) {
						this.viewStateData.updateValue('customDPI', this.customDPI);
					}
					this.viewStateData.updateValue('percents', this.GetScale());

					var canvas = null;

					if (
						this.measureContainer !== null &&
						this.measureContainer.svgPage.childs !== 0
					) {
						canvas = this.getCanvas(true);
						var measureSvg = parser.innerXML(
							this.measureContainer.svgPage.getXML()
						);

						if (measureSvg) {
							var scrollTop =
								this.measureContainer.svgPageContainer.offsetTop +
								(this.measureContainer.svgPageContainer.scrollHeight -
									this.measureContainer.svgPage.height) /
									2 -
								this.scrollPositionTop;
							var scrollLeft =
								this.measureContainer.svgPageContainer.offsetLeft +
								(this.measureContainer.svgPageContainer.scrollWidth -
									this.measureContainer.svgPage.width) /
									2 -
								this.scrollPositionLeft;
							canvas
								.getContext('2d')
								.drawSvg(
									measureSvg,
									scrollLeft,
									scrollTop,
									this.measureContainer.svgPage.width,
									this.measureContainer.svgPage.height
								);
						}
					} else {
						canvas = this.getCanvas();
					}

					return canvas.toDataURL();
				},

				isCanvasImgEmpty: function (imageToCompare) {
					var emptyCanvas = this.getCanvas();
					emptyCanvas
						.getContext('2d')
						.clearRect(0, 0, emptyCanvas.width, emptyCanvas.height);
					var emptyCanvasData = emptyCanvas.toDataURL();
					return imageToCompare == emptyCanvasData;
				},

				onZoomChangeEventHandler: function (ev) {
					const zoomIndex = 0;
					const data = ev.detail[zoomIndex];

					this.inherited(arguments);

					if (this.hidden || !data || data < 0) {
						return;
					}

					var curScale = data * this.viewer.getToPdfTronZoomFactor();

					this.calculateAndUpdateZoom(curScale);
					this.updateZoomingPage();

					if (this.measureContainer !== null) {
						this.measureContainer.resizeSvgPage(
							this.viewerContainer.firstElementChild.contentWindow.document
						);
					}
				},

				getLoadingProgress: function () {
					if (
						typeof this.progressBar === 'undefined' ||
						this.progressBar === null
					) {
						return null;
					}

					return parseInt(this.progressBar.style.width);
				},

				initLoadingProgress: function (initProgress) {
					this.setLoadingProgress(initProgress);
					this.showLoadingProgress = true;
				},

				isBtnMarkupEnabled: function () {
					return !this.toolbarContainer.btnMarkup.IsDisable;
				},

				// Allocate a loading progress from 81% to 100% for the visible pages which has been completely rendered
				onPageCompleteEventHandler: function (ev, data, canvas) {
					var dMode;
					var vPages;

					if (this.showLoadingProgress) {
						var nextProgress = 101;
						var curProgress = this.getLoadingProgress();
						if (curProgress !== null) {
							dMode = this.viewer.getDisplayMode();
							vPages = dMode.getVisiblePages();
							for (var i = 0; i < vPages.length; i++) {
								var pageNum = vPages[i];
								if (pageNum === data) {
									nextProgress =
										curProgress + (100 - curProgress) / (vPages.length - i);
									break;
								}
							}
						}

						if (nextProgress > 97) {
							nextProgress = 101;
						}
						this.setLoadingProgress(nextProgress);

						if (nextProgress >= 100) {
							// Was moved from onViewerLoaded() function because sometimes it returns empty layer's array on 'documentLoaded' event
							this.getDocumentLayers(this.fileUrl);

							this.showLoadingProgress = false;
						}
					}

					// Was moved from onViewerLoaded() function because visible page's rendering takes some time after document loading
					if (!this.showLoadingProgress) {
						// IR-032761: ITG Viewer: Markup doesn't match viewer after double click zoom
						// IR-039935 "CHROME: SSVC. Black snapshot when switching between modes"
						if (this.isRendering) {
							var self = this;

							dMode = this.viewer.getDisplayMode();
							vPages = dMode.getVisiblePages();
							if (data === vPages[vPages.length - 1]) {
								setTimeout(function () {
									self.isRendering = false;
									self.toolbarContainer.btnMarkup.enable(
										!self.isOutOfContextMode()
									);
								}, 1);
							}
						}
					}
				},

				setupZoomLevelBounds: function () {
					if (!this.readerControl) {
						return;
					}

					this.maxZoom = this.serverMaxZoom;
					if (this.maxZoom === null) {
						this.maxZoom = this.readerControl.MAX_ZOOM;

						if (this.customDPI && this.customDPI > 0) {
							this.maxZoom = this.maxZoom * (this.systemDPI / this.customDPI);
						}
					} else {
						this.maxZoom = this.maxZoom / 100;
						this.readerControl.MAX_ZOOM = this.maxZoom;

						if (this.customDPI && this.customDPI > 0) {
							this.readerControl.MAX_ZOOM =
								this.readerControl.MAX_ZOOM / (this.systemDPI / this.customDPI);
						}
					}
				},

				onKeyPressDocContainer: function (e) {
					if (VC.Utils.isFirefox()) {
						if (e.keyCode === VC.Utils.Enums.AffectedKey.HOME) {
							this.FirstPage();
						} else if (e.keyCode === VC.Utils.Enums.AffectedKey.END) {
							this.LastPage();
							this.docViewerEl.scrollTop = this.docViewerEl.scrollHeight;
						} else if (e.keyCode === VC.Utils.Enums.AffectedKey.PAGEUP) {
							this.PreviousPage();
						} else if (e.keyCode === VC.Utils.Enums.AffectedKey.PAGEDOWN) {
							this.NextPage();
						}
					}
				},

				addPageToPNGConvertionParameters: function (
					currentFileInfo,
					anotherFileInfo
				) {
					var curScale = this.GetScale();

					var height = this.docViewerEl.clientHeight;
					var width = this.docViewerEl.clientWidth;

					var scrollTop = this.docViewerEl.scrollTop;
					var scrollLeft = this.docViewerEl.scrollLeft;

					var pageNum = this.GetCurrentPage();
					var pageContainer = this.readerControl.getPageContainer(pageNum - 1);
					var view = pageContainer[0];

					// The .offsetParent should be used starting from WebViewer's version 2.2.0
					var pageTop = view.offsetParent.offsetTop;
					var pageHeight = view.offsetHeight;
					var pageBottom = pageTop + pageHeight;
					if (pageTop < scrollTop) {
						if (pageBottom >= scrollTop) {
							scrollTop = scrollTop - pageTop;
						}

						if (pageHeight >= scrollTop) {
							pageHeight = pageHeight - scrollTop;
						} else {
							pageHeight = 0;
						}
					} else {
						scrollTop = 0;
					}

					var pageWidth = view.offsetWidth;
					// The .offsetParent should be used starting from WebViewer's version 2.2.0
					var viewLeft = view.offsetLeft + view.offsetParent.offsetLeft;
					if (viewLeft < scrollLeft) {
						scrollLeft = scrollLeft - viewLeft;

						if (pageWidth >= scrollLeft) {
							pageWidth = pageWidth - scrollLeft;
						} else {
							pageWidth = 0;
						}
					} else {
						scrollLeft = 0;
					}

					if (pageHeight < height) {
						height = pageHeight;
					}

					if (pageWidth < width) {
						width = pageWidth;
					}

					if (this.customDPI) {
						currentFileInfo.dpi = this.customDPI;
					} else {
						currentFileInfo.dpi = this.systemDPI;
					}
					currentFileInfo.percents = curScale;
					currentFileInfo.angle = 'e_' + this.viewer.getRotation() * 90;
					currentFileInfo.rectX = scrollLeft;
					currentFileInfo.rectY = scrollTop;
					currentFileInfo.rectW = width;
					currentFileInfo.rectH = height;
					currentFileInfo.pageW = view.offsetWidth;
					currentFileInfo.pageH = view.offsetHeight;
					currentFileInfo.layers = this.layersOnOffOptions;

					if (anotherFileInfo) {
						var prevScale = anotherFileInfo.percents;
						if (prevScale && prevScale !== curScale) {
							var ratio = curScale / prevScale;

							anotherFileInfo.percents = curScale;
							anotherFileInfo.rectX = anotherFileInfo.rectX * ratio;
							anotherFileInfo.rectY = anotherFileInfo.rectY * ratio;
							anotherFileInfo.pageW = anotherFileInfo.pageW * ratio;
							anotherFileInfo.pageH = anotherFileInfo.pageH * ratio;
							anotherFileInfo.rectW = anotherFileInfo.rectW * ratio;
							anotherFileInfo.rectH = anotherFileInfo.rectH * ratio;
						}
					}

					return currentFileInfo;
				},

				initComparisonViewer: function (
					diffVersion,
					fromSnapshot,
					viewStateData
				) {
					var params = {
						maxZoom: this.maxZoom * 100,
						diffVersion: diffVersion,
						fromSnapshot: fromSnapshot ? fromSnapshot : false,
						viewStateData: viewStateData ? viewStateData : null
					};

					this.onInitTempViewer('CViewerLoader', params);
				},

				dispose: function () {
					this.viewer.dispose();
				},

				getViewerType: function () {
					return VC.Utils.Enums.MeasurementUtils.PDFViewer;
				},

				getSnapshotFileName: function () {
					var tooltipTemplate = VC.Utils.GetResource(
						'pdf_downloaded_snapshot_filename_template'
					);
					return tooltipTemplate.Format(
						this.trimFileExtension(this.args.fileName),
						this.GetCurrentPage(),
						VC.Utils.getItemTypeLabelbyName(this.args.markupHolderItemtypeName),
						this.args.holderKeyedName
					);
				},

				setScrollPositionToViewState: function () {
					if (this.docViewerEl) {
						this.scrollPositionTop = this.docViewerEl.scrollTop;
						this.scrollPositionLeft = this.docViewerEl.scrollLeft;

						this.viewStateData.updateValue(
							'scroll_top',
							this.scrollPositionTop
						);
						this.viewStateData.updateValue(
							'scroll_left',
							this.scrollPositionLeft
						);
					}
				}
			});
		})()
	);
});
