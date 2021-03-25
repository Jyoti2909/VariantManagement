VC.Utils.Page.LoadModules(['PdfTronViewerBase']);
VC.Utils.Page.LoadModules(['PdfXodWrapper']);
VC.Utils.Page.LoadModules(['Entities/ActionsPointer']);

require(['dojo/aspect', 'dojo/_base/declare'], function (aspect, declare) {
	return dojo.setObject(
		'VC.PdfTronViewer',
		(function () {
			var intervalObject = {};
			var ConversionOptions = {
				AnnotationOutput: 'PDF_AnnotationOutput',
				DPI: 'PDF_DPI',
				ElementLimit: 'PDF_ElementLimit',
				Flatten: 'PDF_Flatten',
				FlattenThreshold: 'PDF_FlattenThreshold',
				JPGQuality: 'PDF_JPGQuality',
				MaxImageValue: 'PDF_MaxImageValue',
				PreferJPG: 'PDF_PreferJPG',
				ThickenLines: 'PDF_ThickenLines',
				OverprintSimulation: 'PDF_OverprintSimulation'
			};

			return declare('PdfTronViewer', VC.PdfTronViewerBase, {
				aras: null,
				pwd: null,
				viewStateDataApplying: false,
				documentReloading: false,
				isDocumentLoaded: false,
				initialLoading: false,
				isRendering: false,
				iFrame: null,
				docViewerPageContainer: null,
				layersList: null,
				layersOnOffOptions: '',
				viewerLoadedProgress: 10, // Assume a loading progress is 10% when the viewer is ready, before a document is loaded
				documentLoadedProgress: 70, // Allocate a 70% of the loading progress for the document loading
				showLoadingProgress: false,
				scrollPositionTop: 0,
				scrollPositionLeft: 0,
				disableAnnotationsInteraction: false,
				maxZoom: null,
				systemDPI: null,
				customDPI: null,
				onSelectModeSelected: null,
				onZoomModeSelected: null,
				onZoomModeDispose: null,
				pwdDialog: null,
				actionsPointer: new VC.Entities.ActionsPointer(),
				onHandleScrollStateEvent: function (args) {},

				constructor: function (args) {
					this.messageId = null;
					this.type = this.DialogManager.viewerType = 'pdf';
					this.aras = args.aras;
					this.top = args.top;

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
				},

				initializeViewer: function () {
					var errorInfo = {};
					var cData = VC.Utils.getPdfFileInfo(
						this.fileUrl,
						VC.Utils.Enums.PdfHandlerActions.ClientData,
						errorInfo
					);
					if (cData === null || cData === '') {
						if (errorInfo.errorMsg == null) {
							VC.Utils.AlertError(
								VC.Utils.GetResource('pdfv_license_is_invalid')
							);
						}

						return;
					}

					var isEncrypt = VC.Utils.getPdfFileInfo(
						this.fileUrl,
						VC.Utils.Enums.PdfHandlerActions.CheckEncrypt
					);
					if (isEncrypt && isEncrypt.localeCompare('True') === 0) {
						VC.Utils.Page.LoadModules(['Widgets/PasswordDialog']);
						this.pwdDialog = new VC.Widgets.PasswordDialog();
						this.pwdDialog.getPassword(dojo.hitch(this, this.getPwd));
					} else {
						this.createViewer();
					}
				},

				createViewer: function () {
					var parameters = this.getPdfToXODConvertionParameters();

					var pdfInitOptions = {
						ui: 'legacy',
						type: 'html5,silverlight,html5Mobile,flash',
						hideAnnotationPanel: true,
						path:
							this.aras.getBaseURL() +
							'/Modules/aras.innovator.Viewers/Scripts/3rdPartyLibs/pdftronwebviewer-v2.2/lib',
						initialDoc:
							VC.Utils.getBaseUrlWithoutSalt(this.aras) +
							'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
							encodeURIComponent(this.fileUrl) +
							parameters +
							VC.Utils.Enums.PdfHandlerActions.PdfToXod,
						showToolbarControl: false,
						streaming: true
					};

					this.setAnnotationsMode(pdfInitOptions);

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

					// We should call it during the initialization process to disable the Layers button when no layers were found
					this.layersList = this.getDocumentLayers(this.fileUrl, true);
					this.setBtnLayersAccessibility();

					this.hidden = false;
					this.initLoadingProgress(0);
					this.systemDPI = VC.Utils.getXYDPIs()[0];

					this.isViewerInitialized = true;
				},

				setAnnotationsMode: function (pdfOptions) {
					var enableAnnotations = VC.ViewerAgent.getBooleanVariable(
						VC.Utils.Enums.ServerVariable.PDFEnableAnnotations
					);

					this.disableAnnotationsInteraction = enableAnnotations;
					pdfOptions.enableAnnotations = enableAnnotations;
					pdfOptions.enableReadOnlyMode = enableAnnotations;
				},

				getPwd: function (pwd) {
					this.pwd = btoa(pwd);
					var isUnlocked = VC.Utils.getPdfFileInfo(
						this.fileUrl,
						'&ac=' + this.pwd + VC.Utils.Enums.PdfHandlerActions.CheckUnlock
					);
					if (isUnlocked && isUnlocked.localeCompare('True') === 0) {
						this.createViewer();
						if (this.isViewerInitialized) {
							this.mode = this.ViewerModes.View;
							this._loadFile();
						}
					} else {
						this.pwdDialog.getPassword(dojo.hitch(this, this.getPwd));
					}
				},

				getDocumentLayers: function (url, withoutChecking) {
					if (withoutChecking || this.isDocumentInCache(url)) {
						if (this.pwd === null) {
							return VC.Utils.getPdfFileInfo(
								url,
								VC.Utils.Enums.PdfHandlerActions.GetLayers
							);
						} else {
							return VC.Utils.getPdfFileInfo(
								url,
								'&ac=' + this.pwd + VC.Utils.Enums.PdfHandlerActions.GetLayers
							);
						}
					}

					return null;
				},

				isDocumentInCache: function (url) {
					var result = false;
					var inCache = VC.Utils.getPdfFileInfo(
						url,
						VC.Utils.Enums.PdfHandlerActions.CheckCache
					);
					if (inCache && inCache.localeCompare('True') === 0) {
						result = true;
					}

					if (!result) {
						VC.Utils.AlertWarning(
							VC.Utils.GetResource('pdfv_doc_is_expired').Format('')
						);
					}

					return result;
				},

				// Retrive the document's property value from particular or any dictionary of the PDF file
				getDocumentProperty: function (url, propertyName, dictionaryName) {
					if (!this.isDocumentInCache(url)) {
						return null;
					}

					var params = '';
					if (propertyName) {
						params += '&property=' + propertyName;
					}
					if (dictionaryName) {
						params += '&dictionary=' + dictionaryName;
					}

					return VC.Utils.getPdfFileInfo(
						url,
						VC.Utils.Enums.PdfHandlerActions.GetProperty + params
					);
				},

				_toViewMode: function () {
					this.isRendering = true;
					this.toolbarContainer.btnMarkup.enable(false);

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

					if (this.isDocumentLoaded) {
						this.applyViewStateData();
					} else {
						this.actionsPointer.applyViewStateData = true;
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
					var viewerParameters = VC.Utils.Page.GetParams();
					var newFileUrl = aras.IomInnovator.getFileUrl(
						viewerParameters.fileId,
						aras.Enums.UrlType.SecurityToken
					);

					if (layers === null) {
						layers = '';
					}

					if (!this.isDocumentInCache(newFileUrl)) {
						return;
					}

					this.documentReloading = true;
					this.initLoadingProgress(this.viewerLoadedProgress);
					var parameters = this.getPdfToXODConvertionParameters();

					var docURL =
						VC.Utils.getBaseUrlWithoutSalt(this.aras) +
						'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
						encodeURIComponent(newFileUrl) +
						parameters +
						VC.Utils.Enums.PdfHandlerActions.PdfToXod;
					if (layers !== '') {
						docURL = docURL + '&hiddenLayers=' + encodeURIComponent(layers);
					}

					this.viewer.loadDocument(docURL);

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
					this.layersList = this.getDocumentLayers(this.fileUrl);
					this.setBtnLayersAccessibility();

					var layersDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Layers
					);

					if (layersDialog) {
						layersDialog.constructLayers(this.layersList);
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
				},

				isOutOfContextMode: function () {
					return this.fileUrl == null;
				},

				onViewerReady: function () {
					var self = this;
					this.initialLoading = true;
					this.initReaderControl();

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

					dojo.connect(this.docViewerEl, 'onscroll', this, function (event) {
						this.scrollPositionTop = this.docViewerEl.scrollTop;
						this.scrollPositionLeft = this.docViewerEl.scrollLeft;

						if (
							this.viewStateDataApplying ||
							this.documentReloading ||
							!this.isViewerContainerDisplayed
						) {
							return;
						}

						this.viewStateData.updateValue(
							'scroll_top',
							this.scrollPositionTop
						);
						this.viewStateData.updateValue(
							'scroll_left',
							this.scrollPositionLeft
						);
					});

					// Allocate a loading progress from 11% to 80% for the document loading
					if ((VC.Utils.isIE() && VC.Utils.isIE11()) || VC.Utils.isFirefox()) {
						var observer = new MutationObserver(function (mutations) {
							if (!self.showLoadingProgress) {
								return;
							}

							mutations.forEach(function (mutation) {
								for (var i = 0; i < mutation.addedNodes.length; i++) {
									var newNode = mutation.addedNodes[i];
									var idAttr = newNode.attributes.getNamedItem('id');
									if (idAttr) {
										var id = idAttr.value;
										if (id && id.indexOf('pageSection') === 0) {
											var pageNum = id.substr(11, id.length - 11) * 1 + 1;
											self.setLoadingProgress(
												self.viewerLoadedProgress +
													(pageNum / self.viewer.getPageCount()) *
														self.documentLoadedProgress
											);
											break;
										}
									}
								}
							});
						});

						observer.observe(this.docViewerPageContainer, {
							childList: true
						});
					}
					this.iFrame.contentWindow.focus(); //FF
					this.docViewerEl.focus(); //IE

					var params = {};
					params.viewStateData = this.viewStateData;
					params.docViewerEl = this.docViewerEl;
					this.onHandleScrollStateEvent(params);
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
						this.viewerToolbar.btnFind.onClick();
					}

					curState = this.restoreViewerParameter(this.type + '.ActivePalette');
					if (curState !== null) {
						this.cursorMode = curState;
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

				onViewerLoaded: function () {
					this.inherited(arguments);

					this.isDocumentLoaded = true;
					this.viewer.margin = 2;
					this.viewer.setToolbarVisibility(false);
					this.viewer.setSideWindowVisibility(false);

					this._initPageNumberTextBox();
					this._initZoomTextBox();

					this.setViewerModes();

					if (
						this.documentReloading ||
						this.actionsPointer.applyViewStateData
					) {
						this.documentReloading = false;
						this.applyViewStateData();
					}

					if (
						!(VC.Utils.isIE() && VC.Utils.isIE11()) &&
						!VC.Utils.isFirefox()
					) {
						this.setLoadingProgress(
							this.viewerLoadedProgress + this.documentLoadedProgress
						);
					}

					if (this.OnLoaded) {
						this.OnLoaded();
					}

					if (this.initialLoading) {
						this.initialLoading = false;
						this.restoreViewerState();
					}

					if (this.actionsPointer.fireWindowEvent) {
						this._fireResizeWindowEvent();
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

				LoadViewerToolbar: function () {
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

				hideViewer: function () {
					this.inherited(arguments);
					this.hidden = true;
				},

				showViewer: function () {
					this.inherited(arguments);
					this.hidden = false;

					if (this.isDocumentLoaded) {
						this._fireResizeWindowEvent();
					} else {
						this.actionsPointer.fireWindowEvent = true;
					}
				},

				applyViewStateData: function () {
					if (this.viewStateData.isEmpty()) {
						return;
					}
					this.viewMode = 'SetScale';
					this.viewStateDataApplying = true;

					// The document's loading procedure is asynchronous.
					// So we should interrupt applyViewStateData() function after starting the document's loading.
					// It will be continued into the onViewerLoaded() function.
					if (!this.documentReloading) {
						var layers = this.viewStateData.getValue('layers');
						if (
							(layers === '' && this.layersOnOffOptions !== '') ||
							(layers !== '' &&
								layers.localeCompare(this.layersOnOffOptions) !== 0)
						) {
							this.reloadDocument(layers);
							if (layers !== '') {
								this.updateLayersDialog(layers);
							}

							return;
						}
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
						self.actionsPointer.applyViewStateData = false;
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
						if (this.GetScale() / 100 !== zoom) {
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
						if (this.GetScale() / 100 !== zoom) {
							this.isRendering = false;
							this.toolbarContainer.btnMarkup.enable(btnMarkupState);
						}
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
								findDialog.isTextChanged
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

				PageUpClick: function () {
					this.PreviousPage();
				},

				PageDownClick: function () {
					this.NextPage();
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

				PrintClick: function () {
					VC.Utils.Page.LoadModules(['Managers/PrintManager']);
					var newFileUrl = aras.IomInnovator.getFileUrl(
						this.args.fileId,
						aras.Enums.UrlType.SecurityToken
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

				getMarkupImg: function (pageNumber) {
					// IR-033937 "ITG Viewer: Incorrect viewer state after switch from markup"
					if (this.customDPI) {
						this.viewStateData.updateValue('customDPI', this.customDPI);
					}
					this.viewStateData.updateValue('percents', this.GetScale());

					var canvas = this.getCanvas();
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

					if (this.documentReloading || this.hidden || !data || data < 0) {
						return;
					}

					var curScale = data;

					this.calculateAndUpdateZoom(curScale);
					this.updateZoomingPage();
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

				isBtnMarkupEnabled: function () {
					return !this.toolbarContainer.btnMarkup.IsDisable;
				},

				initLoadingProgress: function (initProgress) {
					this.setLoadingProgress(initProgress);
					this.showLoadingProgress = true;
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
							this.showLoadingProgress = false;
						}
					}

					// Was moved from onViewerLoaded() function because visible page's rendering takes some time after document loading
					if (!this.showLoadingProgress) {
						// IR-032761: ITG Viewer: Markup doesn't match viewer after double click zoom
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

					this.maxZoom = this.getVariable(
						VC.Utils.Enums.ServerVariable.PDFMaxZoom
					);
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

				getPdfToXODConvertionParameters: function () {
					var annotationOutput = this.getVariable(
						ConversionOptions.AnnotationOutput
					);
					var dpi = this.getVariable(ConversionOptions.DPI);
					var elementLimit = this.getVariable(ConversionOptions.ElementLimit);
					var flatten = this.getVariable(ConversionOptions.Flatten);
					var flattenThreshold = this.getVariable(
						ConversionOptions.FlattenThreshold
					);
					var jpgQuality = this.getVariable(ConversionOptions.JPGQuality);
					var maxImageValue = this.getVariable(ConversionOptions.MaxImageValue);
					var preferJPG = this.getVariable(ConversionOptions.PreferJPG);
					var thickenLines = this.getVariable(ConversionOptions.ThickenLines);
					var overprintSimulation = this.getVariable(
						ConversionOptions.OverprintSimulation
					);
					var parametersUrl = '';

					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.AnnotationOutput,
						annotationOutput,
						true
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.DPI,
						dpi
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.ElementLimit,
						elementLimit
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.Flatten,
						flatten
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.FlattenThreshold,
						flattenThreshold
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.JPGQuality,
						jpgQuality
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.MaxImageValue,
						maxImageValue
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.PreferJPG,
						preferJPG
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.ThickenLines,
						thickenLines
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						ConversionOptions.OverprintSimulation,
						overprintSimulation
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'ac',
						this.pwd
					);

					if (parametersUrl !== '') {
						parametersUrl = '&' + parametersUrl;
					}

					return parametersUrl;
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

				getVariable: function (variableName) {
					var variable = this.aras.getItemFromServerByName(
						'Variable',
						variableName,
						'value,default_value'
					);
					var returnValue = null;

					if (variable) {
						returnValue = variable.getProperty('value');

						if (!returnValue) {
							returnValue = variable.getProperty('default_value');
						}

						if (!returnValue) {
							returnValue = null;
						}
					}

					return returnValue;
				},

				concatUrlParameters: function (
					parametersUrl,
					parameterName,
					parameterValue,
					firstParameter
				) {
					if (parameterValue !== null) {
						if (firstParameter === undefined || firstParameter === false) {
							parametersUrl = parametersUrl.concat('&');
						}

						parametersUrl = parametersUrl.concat(
							parameterName,
							'=',
							parameterValue
						);
					}

					return parametersUrl;
				},

				getSnapshotFileName: function () {
					var tooltipTemplate = VC.Utils.GetResource(
						'pdf_downloaded_snapshot_filename_template'
					);
					return tooltipTemplate.Format(
						this.trimFileExtension(this.args.fileName),
						this.GetCurrentPage(),
						VC.Utils.getItemTypeLabelbyName(this.args.markupHolderItemtypeName),
						this.args.markupHolderKeyedName
					);
				}
			});
		})()
	);
});
